from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Text, UniqueConstraint, JSON
from sqlalchemy.sql import func
from src.config.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    # Registrar reservacion con desglose de tipos de cliente, impacto y codigo de acceso
    id = Column(Integer, primary_key=True, index=True)
    tourist_id = Column(Integer, index=True, nullable=False)
    experience_id = Column(Integer, index=True, nullable=False)
    activity_date = Column(Date, index=True, nullable=False)
    guests_count = Column(Integer, nullable=False)
    adults_count = Column(Integer, nullable=False, default=1, server_default="1")
    children_count = Column(Integer, nullable=False, default=0, server_default="0")
    seniors_count = Column(Integer, nullable=False, default=0, server_default="0")
    students_count = Column(Integer, nullable=False, default=0, server_default="0")
    guest_breakdown = Column(JSON, nullable=True)
    accessibility_notes = Column(Text, nullable=True)
    base_amount = Column(Numeric(10, 2, asdecimal=False), nullable=False)
    impact_contribution = Column(Numeric(10, 2, asdecimal=False), nullable=False)
    total_amount = Column(Numeric(10, 2, asdecimal=False), nullable=False)
    status = Column(String(30), default="PENDING_PAYMENT", index=True)
    access_code = Column(String(32), unique=True, nullable=True)
    expires_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    # Registrar intento y resultado de cobro en pasarela
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    payment_method = Column(String(50), nullable=False)
    amount = Column(Numeric(10, 2, asdecimal=False), nullable=False)
    status = Column(String(20), nullable=False)
    gateway_reference = Column(String(120), nullable=True)
    failure_reason = Column(String(255), nullable=True)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())


class FavoriteExperience(Base):
    __tablename__ = "favorite_experiences"
    __table_args__ = (
        UniqueConstraint("tourist_id", "experience_id", name="uq_favorite_tourist_exp"),
    )

    # Guardar experiencias marcadas como favoritas por el turista
    id = Column(Integer, primary_key=True, index=True)
    tourist_id = Column(Integer, index=True, nullable=False)
    experience_id = Column(Integer, index=True, nullable=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())


class Itinerary(Base):
    __tablename__ = "itineraries"

    # Agrupar experiencias en itinerarios personalizados de viaje
    id = Column(Integer, primary_key=True, index=True)
    tourist_id = Column(Integer, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    # Vincular experiencia y fecha planeada dentro de un itinerario
    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    experience_id = Column(Integer, nullable=False)
    planned_date = Column(Date, nullable=True)
