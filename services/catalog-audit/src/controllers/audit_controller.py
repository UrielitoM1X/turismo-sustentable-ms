import uuid
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from src.models.catalog_model import SustainabilityAudit, AuditEvidenceFile, Experience
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
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debe adjuntar evidencias")

    ensure_bucket_exists()

    audit = SustainabilityAudit(
        provider_id=provider_id,
        business_name=business_name,
        category=category,
        description=description,
        status="PENDING"
    )
    db.add(audit)
    db.flush()

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
    query = db.query(SustainabilityAudit).filter(SustainabilityAudit.status == "PENDING")
    if category:
        query = query.filter(SustainabilityAudit.category == category)

    audits = query.order_by(SustainabilityAudit.created_at.desc()).all()
    results = []
    for a in audits:
        files = db.query(AuditEvidenceFile).filter(AuditEvidenceFile.audit_id == a.id).all()
        results.append({
            "id": a.id,
            "provider_id": a.provider_id,
            "business_name": a.business_name,
            "category": a.category,
            "description": a.description,
            "status": a.status,
            "created_at": a.created_at,
            "files": [
                {"id": f.id, "file_name": f.file_name, "file_type": f.file_type}
                for f in files
            ]
        })
    return results


def resolve_audit(db: Session, audit_id: int, admin_id: int, decision_data: AuditDecisionRequest) -> dict:
    audit = db.query(SustainabilityAudit).filter(SustainabilityAudit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auditoria no encontrada")

    audit.status = decision_data.decision
    audit.reviewer_notes = decision_data.reviewer_notes
    audit.reviewed_by = admin_id

    # Si el Administrador aprueba la auditoria, activar las experiencias pendientes de este proveedor
    if decision_data.decision == "APPROVED":
        db.query(Experience).filter(
            Experience.provider_id == audit.provider_id,
            Experience.is_active.is_(False)
        ).update({"is_active": True}, synchronize_session=False)

    db.commit()
    return {"audit_id": audit.id, "new_status": audit.status}
