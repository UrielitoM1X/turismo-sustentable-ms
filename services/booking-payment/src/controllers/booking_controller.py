from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import logging
import uuid
import httpx
import redis
from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session
from src.config.settings import settings
from src.models.booking_model import Booking, PaymentTransaction
from src.schemas.booking_schema import BookingCreateRequest, PaymentConfirmRequest
from src.config.redis_client import redis_client
from src.config.rabbitmq_client import publish_event

logger = logging.getLogger(__name__)

_RELEASE_LOCK_SCRIPT = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""


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


def _fetch_experience_metadata(experience_id: int) -> tuple[int, str]:
    # Obtener provider_id y category del catalogo con fallback seguro para evento BI
    try:
        response = httpx.get(
            f"{settings.catalog_service_url}/experiences/{experience_id}",
            params={"include_inactive": "true"},
            timeout=4.0,
        )
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            return int(data.get("provider_id") or 0), str(data.get("category") or "General")
    except Exception as exc:
        logger.warning("No se pudo obtener metadata de experiencia %s: %s", experience_id, exc)
    return 0, "General"


def create_pre_booking(db: Session, tourist_id: int, data: BookingCreateRequest) -> dict:
    # Obtener precio y capacidad ecologica reales desde catalog-service
    exp_data = _fetch_experience_details(data.experience_id)
    try:
        unit_price = exp_data["price"]
        max_ecological_capacity = int(exp_data["max_capacity"])
    except (KeyError, TypeError, ValueError) as exc:
        logger.error("Datos incompletos en catalogo para experiencia %s: %s", data.experience_id, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Catalogo devolvio informacion incompleta de la experiencia"
        )

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
        if booked_spots + data.guests_count > max_ecological_capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cupo ecologico insuficiente para la fecha seleccionada"
            )

        # Calcular desglose economico exacto con Decimal incluyendo aportacion de impacto local (5%)
        base_amount = (Decimal(str(unit_price)) * data.guests_count).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        impact_contribution = (base_amount * Decimal("0.05")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_amount = base_amount + impact_contribution

        booking = Booking(
            tourist_id=tourist_id,
            experience_id=data.experience_id,
            activity_date=data.activity_date,
            guests_count=data.guests_count,
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

    # Confirmar pago, generar codigo de acceso unico y emitir evento asincrono
    access_code = f"TS-{uuid.uuid4().hex[:12].upper()}"
    booking.status = "CONFIRMED"
    booking.access_code = access_code

    success_tx = PaymentTransaction(
        booking_id=booking.id,
        payment_method=payment_data.payment_method,
        amount=booking.total_amount,
        status="SUCCEEDED",
        gateway_reference=f"PAY-{uuid.uuid4().hex[:12].upper()}"
    )
    db.add(success_tx)
    db.commit()

    provider_id, category = _fetch_experience_metadata(booking.experience_id)

    # Notificar a bi-analytics y social-chat mediante RabbitMQ
    publish_event("booking.confirmed", {
        "booking_id": booking.id,
        "tourist_id": booking.tourist_id,
        "experience_id": booking.experience_id,
        "provider_id": provider_id,
        "category": category,
        "guests_count": booking.guests_count,
        "total_amount": float(booking.total_amount),
        "impact_contribution": float(booking.impact_contribution)
    })

    return {
        "booking_id": booking.id,
        "status": "CONFIRMED",
        "access_code": access_code,
        "total_paid": float(booking.total_amount)
    }


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
            "total_amount": float(b.total_amount),
            "status": b.status,
            "access_code": b.access_code
        }
        for b in bookings
    ]