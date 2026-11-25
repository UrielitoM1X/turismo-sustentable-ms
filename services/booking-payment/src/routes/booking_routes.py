from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.utils.auth_guard import verify_jwt_token
from src.schemas.booking_schema import BookingCreateRequest, PaymentConfirmRequest
from src.controllers.booking_controller import (
    create_pre_booking,
    process_booking_payment,
    cancel_booking,
    list_tourist_bookings
)

router = APIRouter(prefix="/reservations", tags=["Bookings & Payments"])


@router.post("/reserve", status_code=status.HTTP_201_CREATED)
def reserve_experience(
    data: BookingCreateRequest,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Generar pre-reserva verificando cupo ecologico
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo turistas pueden reservar")
    return create_pre_booking(db, int(payload["sub"]), data)


@router.post("/pay")
def pay_reservation(
    payment_data: PaymentConfirmRequest,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Confirmar pago de reserva o gestionar rechazo bancario
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo turistas pueden pagar reservas")
    return process_booking_payment(db, int(payload["sub"]), payment_data)


@router.post("/{booking_id}/cancel")
def cancel_reservation(
    booking_id: int,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Cancelar reserva pendiente de pago y liberar cupo ecologico
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo turistas pueden cancelar reservas")
    return cancel_booking(db, int(payload["sub"]), booking_id)


@router.get("/my-bookings")
def get_my_bookings(
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Listar reservas activas e historial del turista
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo turistas pueden consultar sus reservas")
    return list_tourist_bookings(db, int(payload["sub"]))