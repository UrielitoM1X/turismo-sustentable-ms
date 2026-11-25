from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.utils.auth_guard import verify_jwt_token
from src.schemas.booking_schema import (
    BookingCreateRequest,
    PaymentConfirmRequest,
    StripeCheckoutSessionRequest,
    StripeVerifySessionRequest,
)
from src.controllers.booking_controller import (
    cancel_booking,
    create_pre_booking,
    create_stripe_checkout_for_booking,
    get_payment_config,
    handle_stripe_webhook,
    list_tourist_bookings,
    process_booking_payment,
    verify_stripe_checkout_payment,
)

router = APIRouter(prefix="/reservations", tags=["Bookings & Payments"])


@router.get("/payment-config")
def read_payment_config():
    # Informar al frontend si Stripe Checkout esta activo o en fallback simulado
    return get_payment_config()


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
    # Confirmar pago de reserva en modo simulado o gestionar rechazo bancario
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo turistas pueden pagar reservas")
    return process_booking_payment(db, int(payload["sub"]), payment_data)


@router.post("/stripe/checkout-session")
def start_stripe_checkout(
    data: StripeCheckoutSessionRequest,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Crear sesion de Stripe Checkout alojada (PCI-free) para la pre-reserva
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo turistas pueden pagar reservas")
    return create_stripe_checkout_for_booking(db, int(payload["sub"]), data)


@router.post("/stripe/verify")
def verify_stripe_checkout(
    data: StripeVerifySessionRequest,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Confirmar reserva tras redireccion de Stripe verificando server-to-server
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo turistas pueden verificar reservas")
    return verify_stripe_checkout_payment(db, int(payload["sub"]), data)


@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(default="", alias="Stripe-Signature"),
    db: Session = Depends(get_db),
):
    # Recibir eventos firmados de Stripe (checkout.session.completed / expired)
    raw_body = await request.body()
    return handle_stripe_webhook(db, raw_body, stripe_signature)


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
