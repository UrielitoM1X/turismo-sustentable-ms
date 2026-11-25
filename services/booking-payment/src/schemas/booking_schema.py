from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class GuestBreakdown(BaseModel):
    adults: int = Field(default=0, ge=0, le=50)
    children: int = Field(default=0, ge=0, le=50)
    seniors: int = Field(default=0, ge=0, le=50)
    students: int = Field(default=0, ge=0, le=50)

    @property
    def total(self) -> int:
        return self.adults + self.children + self.seniors + self.students

    def as_dict(self) -> dict[str, int]:
        return {
            "adults": self.adults,
            "children": self.children,
            "seniors": self.seniors,
            "students": self.students,
        }


class BookingCreateRequest(BaseModel):
    # Validar solicitud de pre-reserva con desglose opcional por tipo de cliente
    experience_id: int = Field(gt=0)
    activity_date: date
    guests_count: Optional[int] = Field(default=None, gt=0, le=50)
    guest_breakdown: Optional[GuestBreakdown] = None
    accessibility_notes: Optional[str] = Field(default=None, max_length=500)
    unit_price: Optional[float] = Field(default=None, ge=0)
    max_ecological_capacity: Optional[int] = Field(default=None, gt=0, le=50)

    @field_validator("activity_date")
    @classmethod
    def validate_activity_date(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("La fecha de la actividad no puede ser anterior a hoy")
        return value

    @model_validator(mode="after")
    def sync_guests_and_breakdown(self) -> "BookingCreateRequest":
        if self.guest_breakdown is None:
            if self.guests_count is None:
                raise ValueError("Debe especificar guests_count o guest_breakdown")
            self.guest_breakdown = GuestBreakdown(adults=self.guests_count)
            return self

        total = self.guest_breakdown.total
        if total <= 0:
            raise ValueError("Debe incluir al menos un visitante en el desglose")
        if total > 50:
            raise ValueError("El total de visitantes no puede exceder 50")

        if self.guests_count is not None and self.guests_count != total:
            raise ValueError("guests_count debe coincidir con la suma de guest_breakdown")

        self.guests_count = total
        return self


class PaymentConfirmRequest(BaseModel):
    # Validar datos de confirmacion o simulacion de fallo en pasarela
    booking_id: int = Field(gt=0)
    payment_method: Literal["CARD", "TRANSFER", "WALLET"]
    simulate_failure: bool = False


class StripeCheckoutSessionRequest(BaseModel):
    # Solicitar creacion de sesion alojada de Stripe Checkout para una pre-reserva
    booking_id: int = Field(gt=0)
    frontend_origin: Optional[str] = Field(default=None, max_length=255)


class StripeVerifySessionRequest(BaseModel):
    # Verificar server-to-server el pago completado en Stripe Checkout
    booking_id: int = Field(gt=0)
    session_id: str = Field(min_length=5, max_length=255)


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
