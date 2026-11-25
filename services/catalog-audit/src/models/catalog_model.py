from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from src.config.database import Base


class SustainabilityAudit(Base):
    __tablename__ = "sustainability_audits"

    # Registrar solicitud de validacion sustentable por proveedor
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, index=True, nullable=False)
    business_name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING", index=True)
    reviewer_notes = Column(Text, nullable=True)
    reviewed_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AuditEvidenceFile(Base):
    __tablename__ = "audit_evidence_files"

    # Vincular multiples PDFs y fotografias a una solicitud de auditoria
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("sustainability_audits.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)
    s3_object_key = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())


class Experience(Base):
    __tablename__ = "experiences"

    # Definir experiencia turistica sustentable restringida a CDMX
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, index=True, nullable=False)
    audit_id = Column(Integer, ForeignKey("sustainability_audits.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), index=True, nullable=False)
    borough_cdmx = Column(String(80), index=True, nullable=False)
    location = Column(Geography(geometry_type="POINT", srid=4326), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    max_capacity = Column(Integer, nullable=False)
    pet_friendly = Column(Boolean, default=False)
    accessible = Column(Boolean, default=False)
    sustainable_practices = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())