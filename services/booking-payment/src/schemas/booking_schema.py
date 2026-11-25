from datetime import date
from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional


class BookingCreateRequest(BaseModel):
    # Validar solicitud de pre-reserva antes de procesar pago
    experience_id: int = Field(gt=0)
    activity_date: date
    guests_count: int = Field(gt=0, le=50)
    accessibility_notes: Optional[str] = Field(default=None, max_length=500)
    unit_price: Optional[float] = Field(default=None, ge=0)
    max_ecological_capacity: Optional[int] = Field(default=None, gt=0, le=50)

    @field_validator("activity_date")
    @classmethod
    def validate_activity_date(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("La fecha de la actividad no puede ser anterior a hoy")
        return value


class PaymentConfirmRequest(BaseModel):
    # Validar datos de confirmacion o simulacion de fallo en pasarela
    booking_id: int = Field(gt=0)
    payment_method: Literal["CARD", "TRANSFER", "WALLET"]
    simulate_failure: bool = False


class ItineraryCreateRequest(BaseModel):
    # Validar creacion de itinerario personal
    title: str = Field(min_length=3, max_length=150)


class ItineraryItemAddRequest(BaseModel):
    # Validar agregacion de experiencia a itinerario
    experience_id: int = Field(gt=0)
    planned_date: Optional[date] = None

    @field_validator("planned_date")
    @classmethod
    def validate_planned_date(cls, value: Optional[date]) -> Optional[date]:
        if value is not None and value < date.today():
            raise ValueError("La fecha planeada no puede ser anterior a hoy")
        return value