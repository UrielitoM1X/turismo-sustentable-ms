from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from src.config.database import Base


class BookingMetricRecord(Base):
    __tablename__ = "booking_metric_records"

    # Almacenar hechos de reservas confirmadas para agregacion rapida en BI
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, unique=True, index=True, nullable=False)
    tourist_id = Column(Integer, index=True, nullable=False)
    experience_id = Column(Integer, index=True, nullable=False)
    provider_id = Column(Integer, index=True, default=0)
    category = Column(String(50), index=True, default="General")
    guests_count = Column(Integer, nullable=False)
    total_amount = Column(Float, nullable=False)
    impact_contribution = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())