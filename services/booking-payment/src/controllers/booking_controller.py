import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.models.booking_model import Booking, PaymentTransaction
from src.schemas.booking_schema import BookingCreateRequest, PaymentConfirmRequest
from src.config.redis_client import redis_client
from src.config.rabbitmq_client import publish_event


def create_pre_booking(db: Session, tourist_id: int, data: BookingCreateRequest) -> dict:
    # Adquirir bloqueo atomico en Redis para evitar sobreventa simultanea
    lock_key = f"lock:exp:{data.experience_id}:{data.activity_date}"
    if not redis_client.set(lock_key, "locked", nx=True, ex=10):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Otro usuario esta reservando esta fecha, intente en unos segundos"
        )

    try:
        # Calcular lugares ocupados actualmente en reservas confirmadas o pendientes
        booked_spots = db.query(func.coalesce(func.sum(Booking.guests_count), 0)).filter(
            Booking.experience_id == data.experience_id,
            Booking.activity_date == data.activity_date,
            Booking.status.in_(["CONFIRMED", "PENDING_PAYMENT"])
        ).scalar()

        # Verificar que no se exceda el limite de capacidad ecologica
        if booked_spots + data.guests_count > data.max_ecological_capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cupo ecologico insuficiente para la fecha seleccionada"
            )

        # Calcular desglose economico incluyendo aportacion de impacto local (5%)
        base_amount = round(data.unit_price * data.guests_count, 2)
        impact_contribution = round(base_amount * 0.05, 2)
        total_amount = round(base_amount + impact_contribution, 2)

        booking = Booking(
            tourist_id=tourist_id,
            experience_id=data.experience_id,
            activity_date=data.activity_date,
            guests_count=data.guests_count,
            accessibility_notes=data.accessibility_notes,
            base_amount=base_amount,
            impact_contribution=impact_contribution,
            total_amount=total_amount,
            status="PENDING_PAYMENT"
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

        return {
            "booking_id": booking.id,
            "base_amount": booking.base_amount,
            "impact_contribution": booking.impact_contribution,
            "total_amount": booking.total_amount,
            "status": booking.status
        }
    finally:
        # Liberar bloqueo en Redis tras finalizar verificacion
        redis_client.delete(lock_key)


def process_booking_payment(db: Session, tourist_id: int, payment_data: PaymentConfirmRequest) -> dict:
    # Buscar reserva pendiente perteneciente al turista autenticado
    booking = db.query(Booking).filter(
        Booking.id == payment_data.booking_id,
        Booking.tourist_id == tourist_id
    ).first()

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada")

    if booking.status == "CONFIRMED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La reserva ya fue pagada")

    # Manejar escenario explicito de pago fallido sin realizar cargo
    if payment_data.simulate_failure:
        failed_tx = PaymentTransaction(
            booking_id=booking.id,
            payment_method=payment_data.payment_method,
            amount=booking.total_amount,
            status="FAILED",
            failure_reason="Fondos insuficientes o rechazo de entidad bancaria"
        )
        db.add(failed_tx)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No fue posible procesar el pago. No se realizo ningun cargo."
        )

    # Confirmar pago, generar codigo de acceso unico y emitir evento asincrono
    access_code = f"TS-{uuid.uuid4().hex[:8].upper()}"
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

    # Notificar a bi-analytics y social-chat mediante RabbitMQ
    publish_event("booking.confirmed", {
        "booking_id": booking.id,
        "tourist_id": booking.tourist_id,
        "experience_id": booking.experience_id,
        "guests_count": booking.guests_count,
        "total_amount": booking.total_amount,
        "impact_contribution": booking.impact_contribution
    })

    return {
        "booking_id": booking.id,
        "status": "CONFIRMED",
        "access_code": access_code,
        "total_paid": booking.total_amount
    }


def list_tourist_bookings(db: Session, tourist_id: int) -> list[dict]:
    # Consultar historial y proximas reservas del turista
    bookings = db.query(Booking).filter(Booking.tourist_id == tourist_id).order_by(Booking.activity_date.desc()).all()
    return [
        {
            "id": b.id,
            "experience_id": b.experience_id,
            "activity_date": b.activity_date,
            "guests_count": b.guests_count,
            "total_amount": b.total_amount,
            "status": b.status,
            "access_code": b.access_code
        }
        for b in bookings
    ]