import time
import httpx

# Definir URL base apuntando al API Gateway interno de Docker
GATEWAY_URL = "http://gateway"


def run_end_to_end_verification() -> None:
    print("Iniciando verificacion End-to-End de Turismo Sustentable...")

    with httpx.Client(base_url=GATEWAY_URL, timeout=10.0) as client:
        # 1. Registrar Administrador, Proveedor y Turista
        suffix = int(time.time())
        admin_res = client.post("/api/auth/users/register", json={
            "email": f"admin_{suffix}@ts.mx",
            "password": "Password123!",
            "full_name": "Ana Martinez",
            "role": "ADMIN"
        })
        assert admin_res.status_code == 201, f"Fallo registro admin: {admin_res.text}"
        admin_token = admin_res.json()["access_token"]

        prov_res = client.post("/api/auth/users/register", json={
            "email": f"prov_{suffix}@ts.mx",
            "password": "Password123!",
            "full_name": "Cooperativa Xochimilco",
            "role": "PROVIDER",
            "business_name": "Chinampas Vivas SC",
            "rfc": f"CVI{str(suffix)[-6:]}ABC"
        })
        assert prov_res.status_code == 201, f"Fallo registro proveedor: {prov_res.text}"
        prov_token = prov_res.json()["access_token"]

        tour_res = client.post("/api/auth/users/register", json={
            "email": f"turista_{suffix}@ts.mx",
            "password": "Password123!",
            "full_name": "Uriel Miranda",
            "role": "TOURIST"
        })
        assert tour_res.status_code == 201, f"Fallo registro turista: {tour_res.text}"
        tour_token = tour_res.json()["access_token"]
        print("[OK] 1. Usuarios registrados y tokens JWT emitidos.")

        # 2. Subir evidencias ambientales como Proveedor hacia S3/RustFS
        files_payload = [
            ("files", ("Certificacion_Ambiental.pdf", b"%PDF-1.4 evidencia prueba", "application/pdf")),
            ("files", ("chinampa.jpg", b"\xff\xd8\xff\xe0 imagen prueba", "image/jpeg"))
        ]
        audit_res = client.post(
            "/api/catalog/audits/submit",
            headers={"Authorization": f"Bearer {prov_token}"},
            data={
                "business_name": "Chinampas Vivas SC",
                "category": "Naturaleza",
                "description": "Agricultura regenerativa y recorridos sin motor en canales."
            },
            files=files_payload
        )
        assert audit_res.status_code == 201, f"Fallo subida de evidencias: {audit_res.text}"
        audit_id = audit_res.json()["audit_id"]
        print(f"[OK] 2. Evidencias subidas a S3/RustFS (Auditoria ID: {audit_id}).")

        # 3. Aprobar auditoria como Administrador
        decide_res = client.patch(
            f"/api/catalog/audits/{audit_id}/decision",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"decision": "APPROVED", "reviewer_notes": "Documentacion en regla"}
        )
        assert decide_res.status_code == 200, f"Fallo aprobacion de auditoria: {decide_res.text}"
        print("[OK] 3. Auditoria aprobada por administrador.")

        # 4. Publicar experiencia sustentable validada en PostGIS (Xochimilco)
        exp_res = client.post(
            "/api/catalog/experiences/",
            headers={"Authorization": f"Bearer {prov_token}"},
            json={
                "title": "Amanecer en Chinampa Agroecologica",
                "description": "Recorrido guiado en trajinera tradicional y cosecha organica.",
                "category": "Naturaleza",
                "borough_cdmx": "Xochimilco",
                "latitude": 19.2647,
                "longitude": -99.1036,
                "duration_minutes": 180,
                "price": 650.0,
                "max_capacity": 8,
                "pet_friendly": True,
                "accessible": True,
                "sustainable_practices": "Cero plasticos, energia solar y compostaje local."
            }
        )
        assert exp_res.status_code == 201, f"Fallo publicacion de experiencia: {exp_res.text}"
        exp_id = exp_res.json()["id"]
        print(f"[OK] 4. Experiencia publicada en CDMX (ID: {exp_id}).")

        # 5. Consultar asistente conversacional IA
        ai_res = client.post(
            "/api/ai/assistant/chat",
            json={"message": "Busco algo de naturaleza y accesible para ir con mi perro"}
        )
        assert ai_res.status_code == 200, f"Fallo asistente IA: {ai_res.text}"
        print(f"[OK] 5. Asistente IA respondio: {ai_res.json()['assistant_reply']}")

        # 6. Crear pre-reserva con bloqueo en Redis y confirmar pago
        reserve_res = client.post(
            "/api/bookings/reservations/reserve",
            headers={"Authorization": f"Bearer {tour_token}"},
            json={
                "experience_id": exp_id,
                "activity_date": "2026-12-15",
                "guests_count": 2,
                "accessibility_notes": "Acceso a nivel de embarcadero",
                "unit_price": 650.0,
                "max_ecological_capacity": 8
            }
        )
        assert reserve_res.status_code == 201, f"Fallo pre-reserva: {reserve_res.text}"
        booking_id = reserve_res.json()["booking_id"]

        pay_res = client.post(
            "/api/bookings/reservations/pay",
            headers={"Authorization": f"Bearer {tour_token}"},
            json={
                "booking_id": booking_id,
                "payment_method": "CARD",
                "simulate_failure": False
            }
        )
        assert pay_res.status_code == 200, f"Fallo pago: {pay_res.text}"
        print(f"[OK] 6. Reserva pagada. Codigo de acceso: {pay_res.json()['access_code']}")

        # 7. Esperar 2 segundos para propagacion RabbitMQ y consultar Panel BI
        time.sleep(2)
        bi_res = client.get(
            "/api/bi/dashboard/summary",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert bi_res.status_code == 200, f"Fallo consulta BI: {bi_res.text}"
        print(f"[OK] 7. Panel BI actualizado via RabbitMQ: {bi_res.json()['kpis']}")


if __name__ == "__main__":
    run_end_to_end_verification()