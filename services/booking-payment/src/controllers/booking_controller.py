from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import logging
import uuid
import httpx
import redis
import stripe
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session
from src.config.settings import settings
from src.config.redis_client import redis_client
from src.config.rabbitmq_client import publish_event
from src.config.stripe_client import (
    construct_webhook_event,
    create_checkout_session,
    is_stripe_configured,
    is_stripe_test_mode,
    retrieve_checkout_session,
)
from src.models.booking_model import Booking, PaymentTransaction
from src.schemas.booking_schema import (
    BookingCreateRequest,
    GuestBreakdown,
    PaymentConfirmRequest,
    StripeCheckoutSessionRequest,
    StripeVerifySessionRequest,
)

logger = logging.getLogger(__name__)

# Server-authoritative tariff multipliers per customer type
GUEST_RATE_MULTIPLIERS = {
    "adults": Decimal("1.00"),
    "children": Decimal("0.50"),
    "seniors": Decimal("0.70"),
    "students": Decimal("0.80"),
}

_RELEASE_LOCK_SCRIPT = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""


def _calculate_base_amount(unit_price: Decimal, breakdown: GuestBreakdown) -> Decimal:
    total = (
        unit_price * GUEST_RATE_MULTIPLIERS["adults"] * breakdown.adults
        + unit_price * GUEST_RATE_MULTIPLIERS["children"] * breakdown.children
        + unit_price * GUEST_RATE_MULTIPLIERS["seniors"] * breakdown.seniors
        + unit_price * GUEST_RATE_MULTIPLIERS["students"] * breakdown.students
    )
    return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _serialize_guest_breakdown(booking: Booking) -> dict[str, int]:
    if isinstance(booking.guest_breakdown, dict):
        return {
            "adults": int(booking.guest_breakdown.get("adults", 0)),
            "children": int(booking.guest_breakdown.get("children", 0)),
            "seniors": int(booking.guest_breakdown.get("seniors", 0)),
            "students": int(booking.guest_breakdown.get("students", 0)),
        }
    return {
        "adults": int(booking.adults_count if booking.adults_count is not None else booking.guests_count),
        "children": int(booking.children_count or 0),
        "seniors": int(booking.seniors_count or 0),
        "students": int(booking.students_count or 0),
    }


def _fetch_experience_details(experience_id: int) -> dict:
    # Consultar autoritativamente precio, capacidad y estado en catalog-service
    try:
        response = httpx.get(
            f"{settings.catalog_service_url}/experiences/{experience_id}",
            timeout=5.0,
        )
    except httpx.RequestError as exc:
        logger.error("Error de red consultando catalog-service para experiencia %s: %s", experience_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de catalogo no disponible"
        )

    if response.status_code == status.HTTP_404_NOT_FOUND:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiencia no encontrada")

    if response.status_code != status.HTTP_200_OK:
        logger.error("Catalog-service respondio %s para experiencia %s", response.status_code, experience_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Error al consultar el catalogo de experiencias"
        )

    try:
        exp_data = response.json()
    except ValueError as exc:
        logger.error("Respuesta JSON invalida de catalog-service para experiencia %s: %s", experience_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Respuesta invalida del servicio de catalogo"
        )

    if exp_data.get("is_active") is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La experiencia no esta activa para reservaciones"
        )

    return exp_data


def _fetch_experience_metadata(experience_id: int) -> tuple[int, str, str]:
    # Obtener provider_id, category y title del catalogo con fallback seguro
    try:
        response = httpx.get(
            f"{settings.catalog_service_url}/experiences/{experience_id}",
            params={"include_inactive": "true"},
            timeout=4.0,
        )
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            return (
                int(data.get("provider_id") or 0),
                str(data.get("category") or "General"),
                str(data.get("title") or f"Experiencia #{experience_id}"),
            )
    except Exception as exc:
        logger.warning("No se pudo obtener metadata de experiencia %s: %s", experience_id, exc)
    return 0, "General", f"Experiencia #{experience_id}"


def _confirm_booking_locked(
    db: Session,
    booking: Booking,
    *,
    payment_method: str,
    gateway_reference: str,
) -> dict:
    """Confirm a row-locked booking idempotently and publish BI event once."""
    breakdown = _serialize_guest_breakdown(booking)

    if booking.status == "CONFIRMED":
        return {
            "booking_id": booking.id,
            "status": "CONFIRMED",
            "access_code": booking.access_code,
            "total_paid": float(booking.total_amount),
            "guest_breakdown": breakdown,
        }

    access_code = f"TS-{uuid.uuid4().hex[:12].upper()}"
    booking.status = "CONFIRMED"
    booking.access_code = access_code

    success_tx = PaymentTransaction(
        booking_id=booking.id,
        payment_method=payment_method,
        amount=booking.total_amount,
        status="SUCCEEDED",
        gateway_reference=gateway_reference,
    )
    db.add(success_tx)
    db.commit()

    provider_id, category, _ = _fetch_experience_metadata(booking.experience_id)

    publish_event("booking.confirmed", {
        "booking_id": booking.id,
        "tourist_id": booking.tourist_id,
        "experience_id": booking.experience_id,
        "provider_id": provider_id,
        "category": category,
        "guests_count": booking.guests_count,
        "guest_breakdown": breakdown,
        "adults_count": breakdown["adults"],
        "children_count": breakdown["children"],
        "seniors_count": breakdown["seniors"],
        "students_count": breakdown["students"],
        "total_amount": float(booking.total_amount),
        "impact_contribution": float(booking.impact_contribution),
    })

    return {
        "booking_id": booking.id,
        "status": "CONFIRMED",
        "access_code": access_code,
        "total_paid": float(booking.total_amount),
        "guest_breakdown": breakdown,
    }


def get_payment_config() -> dict:
    configured = is_stripe_configured()
    return {
        "provider": "stripe" if configured else "simulated",
        "stripe_enabled": configured,
        "test_mode": is_stripe_test_mode() if configured else True,
        "currency": "MXN",
    }


def create_pre_booking(db: Session, tourist_id: int, data: BookingCreateRequest) -> dict:
    # Obtener precio y capacidad ecologica reales desde catalog-service
    exp_data = _fetch_experience_details(data.experience_id)
    try:
        unit_price = Decimal(str(exp_data["price"]))
        max_ecological_capacity = int(exp_data["max_capacity"])
    except (KeyError, TypeError, ValueError) as exc:
        logger.error("Datos incompletos en catalogo para experiencia %s: %s", data.experience_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Catalogo devolvio informacion incompleta de la experiencia"
        )

    breakdown = data.guest_breakdown or GuestBreakdown(adults=data.guests_count or 1)
    total_guests = breakdown.total

    # Adquirir bloqueo atomico en Redis con token unico para evitar sobreventa simultanea
    lock_key = f"lock:exp:{data.experience_id}:{data.activity_date}"
    lock_token = str(uuid.uuid4())
    try:
        acquired = redis_client.set(lock_key, lock_token, nx=True, ex=10)
    except redis.RedisError as exc:
        logger.error("Error de Redis al adquirir bloqueo %s: %s", lock_key, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de disponibilidad temporalmente no disponible"
        )

    if not acquired:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Otro usuario esta reservando esta fecha, intente en unos segundos"
        )

    try:
        now = datetime.utcnow()
        # Calcular lugares ocupados actualmente en reservas confirmadas o pendientes no expiradas
        booked_spots = db.query(func.coalesce(func.sum(Booking.guests_count), 0)).filter(
            Booking.experience_id == data.experience_id,
            Booking.activity_date == data.activity_date,
            or_(
                Booking.status == "CONFIRMED",
                and_(
                    Booking.status == "PENDING_PAYMENT",
                    or_(Booking.expires_at.is_(None), Booking.expires_at > now)
                )
            )
        ).scalar()

        # Verificar que no se exceda el limite de capacidad ecologica
        if booked_spots + total_guests > max_ecological_capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cupo ecologico insuficiente para la fecha seleccionada"
            )

        # Calcular desglose economico exacto por tipo de cliente + aportacion local (5%)
        base_amount = _calculate_base_amount(unit_price, breakdown)
        impact_contribution = (base_amount * Decimal("0.05")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_amount = base_amount + impact_contribution

        breakdown_dict = breakdown.as_dict()
        booking = Booking(
            tourist_id=tourist_id,
            experience_id=data.experience_id,
            activity_date=data.activity_date,
            guests_count=total_guests,
            adults_count=breakdown.adults,
            children_count=breakdown.children,
            seniors_count=breakdown.seniors,
            students_count=breakdown.students,
            guest_breakdown=breakdown_dict,
            accessibility_notes=data.accessibility_notes,
            base_amount=float(base_amount),
            impact_contribution=float(impact_contribution),
            total_amount=float(total_amount),
            status="PENDING_PAYMENT",
            expires_at=now + timedelta(minutes=15)
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

        return {
            "booking_id": booking.id,
            "guests_count": booking.guests_count,
            "guest_breakdown": breakdown_dict,
            "base_amount": float(booking.base_amount),
            "impact_contribution": float(booking.impact_contribution),
            "total_amount": float(booking.total_amount),
            "status": booking.status,
            "expires_at": booking.expires_at
        }
    finally:
        # Liberar bloqueo en Redis de forma atomica validando propiedad del token
        try:
            redis_client.eval(_RELEASE_LOCK_SCRIPT, 1, lock_key, lock_token)
        except redis.RedisError as exc:
            logger.error("Error de Redis al liberar bloqueo %s: %s", lock_key, exc)


def create_stripe_checkout_for_booking(
    db: Session,
    tourist_id: int,
    req: StripeCheckoutSessionRequest,
) -> dict:
    booking = db.query(Booking).filter(
        Booking.id == req.booking_id,
        Booking.tourist_id == tourist_id,
    ).first()

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada")

    if booking.status != "PENDING_PAYMENT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La reserva no puede pagarse en estado {booking.status}",
        )

    if booking.expires_at is not None and booking.expires_at < datetime.utcnow():
        booking.status = "EXPIRED"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La pre-reserva ha expirado, realice una nueva reserva",
        )

    if not is_stripe_configured():
        return {
            "mode": "simulated",
            "booking_id": booking.id,
            "checkout_url": None,
            "session_id": None,
        }

    _, _, exp_title = _fetch_experience_metadata(booking.experience_id)

    try:
        session_info = create_checkout_session(
            booking_id=booking.id,
            tourist_id=tourist_id,
            experience_id=booking.experience_id,
            experience_title=exp_title,
            activity_date=str(booking.activity_date),
            guests_count=booking.guests_count,
            base_amount=float(booking.base_amount),
            impact_contribution=float(booking.impact_contribution),
            frontend_origin=req.frontend_origin or settings.frontend_url,
        )
    except stripe.StripeError as exc:
        logger.error("Error de Stripe creando Checkout Session para reserva %s: %s", booking.id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No fue posible iniciar la sesion de pago en Stripe",
        )

    return {
        "mode": "stripe",
        "booking_id": booking.id,
        "session_id": session_info["session_id"],
        "checkout_url": session_info["checkout_url"],
    }


def verify_stripe_checkout_payment(
    db: Session,
    tourist_id: int,
    req: StripeVerifySessionRequest,
) -> dict:
    if not is_stripe_configured():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stripe no esta configurado en este entorno",
        )

    booking = db.query(Booking).filter(
        Booking.id == req.booking_id,
        Booking.tourist_id == tourist_id,
    ).with_for_update().first()

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada")

    if booking.status == "CONFIRMED":
        return _confirm_booking_locked(
            db,
            booking,
            payment_method="STRIPE_CARD",
            gateway_reference=req.session_id,
        )

    try:
        stripe_session = retrieve_checkout_session(req.session_id)
    except stripe.StripeError as exc:
        logger.error("Error consultando sesion Stripe %s: %s", req.session_id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo verificar el estado del pago en Stripe",
        )

    meta = getattr(stripe_session, "metadata", None) or {}
    meta_booking_id = str(meta.get("booking_id") or getattr(stripe_session, "client_reference_id", ""))
    meta_tourist_id = str(meta.get("tourist_id") or "")

    if meta_booking_id != str(booking.id) or (meta_tourist_id and meta_tourist_id != str(tourist_id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La sesion de Stripe no corresponde a esta reserva",
        )

    if getattr(stripe_session, "payment_status", None) != "paid":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="El pago aun no ha sido completado en Stripe",
        )

    gateway_ref = str(getattr(stripe_session, "payment_intent", None) or req.session_id)
    return _confirm_booking_locked(
        db,
        booking,
        payment_method="STRIPE_CARD",
        gateway_reference=gateway_ref,
    )


def handle_stripe_webhook(db: Session, payload: bytes, sig_header: str) -> dict:
    try:
        event = construct_webhook_event(payload, sig_header)
    except (ValueError, stripe.SignatureVerificationError) as exc:
        logger.warning("Firma invalida o webhook Stripe no configurado: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Webhook Stripe invalido")

    event_type = event.get("type") if isinstance(event, dict) else getattr(event, "type", "")
    data_obj = (
        event.get("data", {}).get("object", {})
        if isinstance(event, dict)
        else getattr(getattr(event, "data", None), "object", {})
    )
    meta = data_obj.get("metadata", {}) if isinstance(data_obj, dict) else getattr(data_obj, "metadata", {}) or {}
    raw_booking_id = meta.get("booking_id") or (
        data_obj.get("client_reference_id")
        if isinstance(data_obj, dict)
        else getattr(data_obj, "client_reference_id", None)
    )

    if not raw_booking_id:
        return {"received": True, "ignored": True}

    try:
        booking_id = int(raw_booking_id)
    except (TypeError, ValueError):
        return {"received": True, "ignored": True}

    booking = db.query(Booking).filter(Booking.id == booking_id).with_for_update().first()
    if not booking:
        return {"received": True, "ignored": True}

    if event_type == "checkout.session.completed":
        payment_status = (
            data_obj.get("payment_status")
            if isinstance(data_obj, dict)
            else getattr(data_obj, "payment_status", None)
        )
        if payment_status == "paid":
            gateway_ref = str(
                (data_obj.get("payment_intent") or data_obj.get("id"))
                if isinstance(data_obj, dict)
                else (getattr(data_obj, "payment_intent", None) or getattr(data_obj, "id", "stripe"))
            )
            _confirm_booking_locked(
                db,
                booking,
                payment_method="STRIPE_CARD",
                gateway_reference=gateway_ref,
            )
    elif event_type == "checkout.session.expired" and booking.status == "PENDING_PAYMENT":
        booking.status = "EXPIRED"
        db.commit()

    return {"received": True, "event_type": event_type}


def process_booking_payment(db: Session, tourist_id: int, payment_data: PaymentConfirmRequest) -> dict:
    # Bloquear fila de reserva para evitar doble cobro o race conditions en pago
    booking = db.query(Booking).filter(
        Booking.id == payment_data.booking_id,
        Booking.tourist_id == tourist_id
    ).with_for_update().first()

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada")

    if booking.status == "CONFIRMED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La reserva ya fue pagada")

    if booking.status != "PENDING_PAYMENT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La reserva no puede pagarse en estado {booking.status}"
        )

    if booking.expires_at is not None and booking.expires_at < datetime.utcnow():
        booking.status = "EXPIRED"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La pre-reserva ha expirado, realice una nueva reserva"
        )

    # Manejar escenario explicito de pago fallido liberando inmediatamente el cupo ecologico
    if payment_data.simulate_failure:
        failed_tx = PaymentTransaction(
            booking_id=booking.id,
            payment_method=payment_data.payment_method,
            amount=booking.total_amount,
            status="FAILED",
            failure_reason="Fondos insuficientes o rechazo de entidad bancaria"
        )
        booking.status = "FAILED"
        db.add(failed_tx)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No fue posible procesar el pago. No se realizo ningun cargo."
        )

    return _confirm_booking_locked(
        db,
        booking,
        payment_method=payment_data.payment_method,
        gateway_reference=f"PAY-{uuid.uuid4().hex[:12].upper()}",
    )


def cancel_booking(db: Session, tourist_id: int, booking_id: int) -> dict:
    # Cancelar pre-reserva pendiente de pago y liberar cupo ecologico
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.tourist_id == tourist_id
    ).with_for_update().first()

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada")

    if booking.status != "PENDING_PAYMENT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden cancelar reservas pendientes de pago"
        )

    booking.status = "CANCELLED"
    db.commit()
    return {"booking_id": booking.id, "status": booking.status}


def list_tourist_bookings(db: Session, tourist_id: int) -> list[dict]:
    # Consultar historial y proximas reservas del turista
    bookings = db.query(Booking).filter(Booking.tourist_id == tourist_id).order_by(Booking.activity_date.desc()).all()
    return [
        {
            "id": b.id,
            "experience_id": b.experience_id,
            "activity_date": b.activity_date,
            "guests_count": b.guests_count,
            "guest_breakdown": _serialize_guest_breakdown(b),
            "accessibility_notes": b.accessibility_notes,
            "impact_contribution": float(b.impact_contribution),
            "total_amount": float(b.total_amount),
            "status": b.status,
            "access_code": b.access_code
        }
        for b in bookings
    ]
