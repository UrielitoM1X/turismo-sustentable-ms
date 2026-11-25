import time
import httpx

GATEWAY_URL = "http://gateway"


def login_and_get_token(client: httpx.Client, email: str, password: str) -> str:
    res = client.post(
        "/api/auth/users/login",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200, f"Fallo login para {email}: {res.text}"
    return res.json()["access_token"]


def run_end_to_end_verification() -> None:
    print("Iniciando verificacion End-to-End multi-rol (ADMIN, PROVIDER, TOURIST)...")

    with httpx.Client(base_url=GATEWAY_URL, timeout=10.0) as client:
        suffix = int(time.time())
        password = "Password123!"

        # =========================================================
        # 1. REGISTRO Y LOGIN DE LOS 3 ROLES (ADMIN, PROVIDER, TOURIST)
        # =========================================================
        admin_email = f"admin_{suffix}@ts.mx"
        prov_email = f"prov_{suffix}@ts.mx"
        tour_email = f"turista_{suffix}@ts.mx"

        admin_res = client.post("/api/auth/users/register", json={
            "email": admin_email,
            "password": password,
            "full_name": "Ana Martinez (Admin)",
            "role": "ADMIN",
        })
        assert admin_res.status_code == 201, f"Fallo registro admin: {admin_res.text}"

        prov_res = client.post("/api/auth/users/register", json={
            "email": prov_email,
            "password": password,
            "full_name": "Cooperativa Xochimilco",
            "role": "PROVIDER",
            "business_name": "Chinampas Vivas SC",
            "rfc": f"CVI{str(suffix)[-6:]}ABC",
        })
        assert prov_res.status_code == 201, f"Fallo registro proveedor: {prov_res.text}"

        tour_res = client.post("/api/auth/users/register", json={
            "email": tour_email,
            "password": password,
            "full_name": "Uriel Miranda",
            "role": "TOURIST",
        })
        assert tour_res.status_code == 201, f"Fallo registro turista: {tour_res.text}"

        # Verificar endpoint /users/login para los 3 roles
        admin_token = login_and_get_token(client, admin_email, password)
        prov_token = login_and_get_token(client, prov_email, password)
        tour_token = login_and_get_token(client, tour_email, password)
        print("[OK] 1. Registro y /users/login verificados para ADMIN, PROVIDER y TOURIST.")

        # =========================================================
        # 2. ROL PROVEEDOR: SUBIR EVIDENCIAS Y CONTROL DE PERMISOS
        # =========================================================
        files_payload = [
            ("files", ("Certificacion_Ambiental.pdf", b"%PDF-1.4 evidencia prueba", "application/pdf")),
            ("files", ("chinampa.jpg", b"\xff\xd8\xff\xe0 imagen prueba", "image/jpeg")),
        ]
        audit_res = client.post(
            "/api/catalog/audits/submit",
            headers={"Authorization": f"Bearer {prov_token}"},
            data={
                "business_name": "Chinampas Vivas SC",
                "category": "Naturaleza",
                "description": "Agricultura regenerativa y recorridos sin motor en canales.",
            },
            files=files_payload,
        )
        assert audit_res.status_code == 201, f"Fallo subida de evidencias: {audit_res.text}"
        audit_id = audit_res.json()["audit_id"]
        print(f"[OK] 2. [PROVIDER] Evidencias subidas a RustFS/MinIO (Auditoria ID: {audit_id}).")

        # Verificar que un TOURIST no puede aprobar auditorias (RBAC 403)
        forbid_decide = client.patch(
            f"/api/catalog/audits/{audit_id}/decision",
            headers={"Authorization": f"Bearer {tour_token}"},
            json={"decision": "APPROVED", "reviewer_notes": "Intento no autorizado"},
        )
        assert forbid_decide.status_code == 403, f"Se esperaba 403 para TOURIST aprobando auditoria: {forbid_decide.status_code}"

        # =========================================================
        # 3. ROL ADMIN: REVISAR PENDIENTES Y APROBAR AUDITORIA
        # =========================================================
        pending_res = client.get(
            "/api/catalog/audits/pending",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert pending_res.status_code == 200, f"Fallo listar auditorias pendientes: {pending_res.text}"

        decide_res = client.patch(
            f"/api/catalog/audits/{audit_id}/decision",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"decision": "APPROVED", "reviewer_notes": "Documentacion en regla"},
        )
        assert decide_res.status_code == 200, f"Fallo aprobacion de auditoria: {decide_res.text}"
        print("[OK] 3. [ADMIN] Auditoria listada y aprobada (RBAC de turista bloqueado en 403).")

        # =========================================================
        # 4. ROL PROVEEDOR: PUBLICAR EXPERIENCIA EN POSTGIS
        # =========================================================
        exp_payload = {
            "title": f"Amanecer en Chinampa Agroecologica #{suffix}",
            "description": "Recorrido guiado en trajinera tradicional y cosecha organica.",
            "category": "Naturaleza",
            "borough_cdmx": "Xochimilco",
            "latitude": 19.2647,
            "longitude": -99.1036,
            "duration_minutes": 180,
            "price": 650.0,
            "max_capacity": 4,
            "pet_friendly": True,
            "accessible": True,
            "sustainable_practices": "Cero plasticos, energia solar y compostaje local.",
        }

        # Verificar que un TOURIST no puede publicar experiencias
        forbid_exp = client.post(
            "/api/catalog/experiences/",
            headers={"Authorization": f"Bearer {tour_token}"},
            json=exp_payload,
        )
        assert forbid_exp.status_code == 403, f"Se esperaba 403 para TOURIST creando experiencia: {forbid_exp.status_code}"

        exp_res = client.post(
            "/api/catalog/experiences/",
            headers={"Authorization": f"Bearer {prov_token}"},
            json=exp_payload,
        )
        assert exp_res.status_code == 201, f"Fallo publicacion de experiencia: {exp_res.text}"
        exp_id = exp_res.json()["id"]
        print(f"[OK] 4. [PROVIDER] Experiencia publicada en CDMX (ID: {exp_id}, cupo max: 4).")

        # =========================================================
        # 5. ROL TURISTA: CONSULTAR CATALOGO Y ASISTENTE IA
        # =========================================================
        cat_res = client.get("/api/catalog/experiences/")
        assert cat_res.status_code == 200 and any(e["id"] == exp_id for e in cat_res.json())

        ai_res = client.post(
            "/api/ai/assistant/chat",
            json={"message": "Busco algo de naturaleza y accesible para ir con mi perro"},
        )
        assert ai_res.status_code == 200, f"Fallo asistente IA: {ai_res.text}"
        print(f"[OK] 5. [TOURIST] Catalogo verificado y Guia IA respondio correctamente.")

        # =========================================================
        # 6. ROL TURISTA: RESERVA, CONTROL DE SOBRECUPO REDIS Y PAGO
        # =========================================================
        reserve_res = client.post(
            "/api/bookings/reservations/reserve",
            headers={"Authorization": f"Bearer {tour_token}"},
            json={
                "experience_id": exp_id,
                "activity_date": "2026-12-15",
                "guests_count": 3,
                "accessibility_notes": "Acceso a nivel de embarcadero",
                "unit_price": 650.0,
                "max_ecological_capacity": 4,
            },
        )
        assert reserve_res.status_code == 201, f"Fallo pre-reserva: {reserve_res.text}"
        booking_id = reserve_res.json()["booking_id"]

        # Intentar reservar 2 lugares mas (3 + 2 = 5 > 4 capacidad maxima ecologica)
        overcap_res = client.post(
            "/api/bookings/reservations/reserve",
            headers={"Authorization": f"Bearer {tour_token}"},
            json={
                "experience_id": exp_id,
                "activity_date": "2026-12-15",
                "guests_count": 2,
                "unit_price": 650.0,
                "max_ecological_capacity": 4,
            },
        )
        assert overcap_res.status_code in (400, 409), f"Redis no bloqueo sobrecupo ecologico: {overcap_res.status_code}"

        pay_res = client.post(
            "/api/bookings/reservations/pay",
            headers={"Authorization": f"Bearer {tour_token}"},
            json={
                "booking_id": booking_id,
                "payment_method": "CARD",
                "simulate_failure": False,
            },
        )
        assert pay_res.status_code == 200, f"Fallo pago: {pay_res.text}"
        access_code = pay_res.json()["access_code"]

        my_bookings_res = client.get(
            "/api/bookings/reservations/my-bookings",
            headers={"Authorization": f"Bearer {tour_token}"},
        )
        assert my_bookings_res.status_code == 200 and len(my_bookings_res.json()) >= 1
        print(f"[OK] 6. [TOURIST] Reserva pagada ({access_code}), historial validado y sobrecupo bloqueado.")

        # =========================================================
        # 7. ROL ADMIN: PANEL BI Y PROTECCION DE ACCESO
        # =========================================================
        time.sleep(2)

        forbid_bi = client.get(
            "/api/bi/dashboard/summary",
            headers={"Authorization": f"Bearer {tour_token}"},
        )
        assert forbid_bi.status_code == 403, f"Se esperaba 403 para TOURIST en BI: {forbid_bi.status_code}"

        bi_res = client.get(
            "/api/bi/dashboard/summary",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert bi_res.status_code == 200, f"Fallo consulta BI: {bi_res.text}"
        print(f"[OK] 7. [ADMIN] Panel BI actualizado via RabbitMQ: {bi_res.json()['kpis']}")

# =========================================================
        # 8. ROL TURISTA: RESENA VERIFICADA Y EVIDENCIA EN SOCIAL-SERVICE
        # =========================================================
        review_res = client.post(
            "/api/social/reviews/",
            headers={"Authorization": f"Bearer {tour_token}"},
            data={
                "experienceId": str(exp_id),
                "rating": "5",
                "comment": "Recorrido autentico sin plasticos y con respeto total a la chinampa.",
                "ecologicalComplianceVerified": "true",
            },
            files=[("photos", ("evidencia_turista.jpg", b"\xff\xd8\xff\xe0 foto", "image/jpeg"))],
        )
        assert review_res.status_code == 201, f"Fallo publicacion de resena: {review_res.text}"

        get_reviews_res = client.get(f"/api/social/reviews/experience/{exp_id}")
        assert get_reviews_res.status_code == 200
        rev_data = get_reviews_res.json()
        assert rev_data["total_reviews"] >= 1 and rev_data["average_rating"] == 5.0
        print(f"[OK] 8. [SOCIAL] Resena con foto subida a RustFS y promedio verificado: {rev_data['average_rating']}/5.")
        
if __name__ == "__main__":
    run_end_to_end_verification()