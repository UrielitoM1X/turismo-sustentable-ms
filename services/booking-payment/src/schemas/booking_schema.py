from datetime import date
from pydantic import BaseModel, Field
from typing import Literal, Optional


class BookingCreateRequest(BaseModel):
    # Validar solicitud de pre-reserva antes de procesar pago
    experience_id: int
    activity_date: date
    guests_count: int = Field(gt=0, le=50)
    accessibility_notes: Optional[str] = Field(default=None, max_length=500)
    unit_price: float = Field(ge=0)
    max_ecological_capacity: int = Field(gt=0, le=50)


class PaymentConfirmRequest(BaseModel):
    # Validar datos de confirmacion o simulacion de fallo en pasarela
    booking_id: int
    payment_method: Literal["CARD", "TRANSFER", "WALLET"]
    simulate_failure: bool = False


class ItineraryCreateRequest(BaseModel):
    # Validar creacion de itinerario personal
    title: str = Field(min_length=3, max_length=150)


class ItineraryItemAddRequest(BaseModel):
    # Validar agregacion de experiencia a itinerario
    experience_id: int
    planned_date: Optional[date] = None