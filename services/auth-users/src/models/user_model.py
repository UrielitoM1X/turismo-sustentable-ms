from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime
from sqlalchemy.sql import func
from src.config.database import Base


class User(Base):
    __tablename__ = "users"

    # Definir atributos base de identidad y acceso
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(30), nullable=False)
    preferred_language = Column(String(10), default="es")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TouristProfile(Base):
    __tablename__ = "tourist_profiles"

    # Vincular preferencias de viaje y accesibilidad del turista
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    travel_interests = Column(JSON, default=list)
    accessibility_needs = Column(JSON, default=list)


class ProviderProfile(Base):
    __tablename__ = "provider_profiles"

    # Vincular datos fiscales y estatus de validacion sustentable del proveedor
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    business_name = Column(String(200), nullable=False)
    rfc = Column(String(13), unique=True, nullable=False)
    validation_status = Column(String(30), default="PENDING")