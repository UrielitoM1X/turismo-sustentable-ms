import uuid
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from src.models.catalog_model import SustainabilityAudit, AuditEvidenceFile
from src.schemas.catalog_schema import AuditDecisionRequest
from src.config.s3_client import s3_client, ensure_bucket_exists
from src.config.settings import settings


async def submit_provider_evidence(
    db: Session,
    provider_id: int,
    business_name: str,
    category: str,
    description: str,
    files: list[UploadFile]
) -> dict:
    # Verificar que se adjunte al menos un documento o fotografia
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debe adjuntar evidencias")

    ensure_bucket_exists()

    # Crear registro de auditoria en estado pendiente
    audit = SustainabilityAudit(
        provider_id=provider_id,
        business_name=business_name,
        category=category,
        description=description,
        status="PENDING"
    )
    db.add(audit)
    db.flush()

    # Subir cada archivo a almacenamiento S3 y guardar referencia en PostgreSQL
    for file in files:
        content = await file.read()
        ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
        file_type = "PDF" if ext == "pdf" else "IMAGE"
        object_key = f"audits/{provider_id}/{audit.id}/{uuid.uuid4()}.{ext}"

        s3_client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=object_key,
            Body=content,
            ContentType=file.content_type or "application/octet-stream"
        )

        db.add(AuditEvidenceFile(
            audit_id=audit.id,
            file_name=file.filename,
            file_type=file_type,
            s3_object_key=object_key
        ))

    db.commit()
    return {"audit_id": audit.id, "status": "PENDING", "files_uploaded": len(files)}


def list_pending_audits(db: Session, category: str | None = None) -> list[dict]:
    # Consultar solicitudes pendientes con filtro opcional por categoria
    query = db.query(SustainabilityAudit).filter(SustainabilityAudit.status == "PENDING")
    if category:
        query = query.filter(SustainabilityAudit.category == category)

    audits = query.order_by(SustainabilityAudit.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "provider_id": a.provider_id,
            "business_name": a.business_name,
            "category": a.category,
            "description": a.description,
            "created_at": a.created_at
        }
        for a in audits
    ]


def resolve_audit(db: Session, audit_id: int, admin_id: int, decision_data: AuditDecisionRequest) -> dict:
    # Emitir aprobacion o rechazo tecnico sobre una auditoria pendiente
    audit = db.query(SustainabilityAudit).filter(SustainabilityAudit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auditoria no encontrada")

    audit.status = decision_data.decision
    audit.reviewer_notes = decision_data.reviewer_notes
    audit.reviewed_by = admin_id
    db.commit()

    return {"audit_id": audit.id, "new_status": audit.status}