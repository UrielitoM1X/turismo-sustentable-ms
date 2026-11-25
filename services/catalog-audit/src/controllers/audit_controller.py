from collections import defaultdict
import logging
from pathlib import Path
import re
import uuid
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool
from src.models.catalog_model import SustainabilityAudit, AuditEvidenceFile, Experience
from src.schemas.catalog_schema import AuditDecisionRequest, normalize_category
from src.config.s3_client import s3_client, ensure_bucket_exists
from src.config.settings import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "webp"}
MAX_FILES_PER_AUDIT = 10
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
SAFE_INLINE_MEDIA_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}


def _detect_file_metadata(ext: str, content: bytes) -> tuple[str, str]:
    # Validar magic bytes reales y devolver (file_type, canonical_content_type)
    if ext == "pdf" and content.startswith(b"%PDF-"):
        return "PDF", "application/pdf"
    if ext in {"jpg", "jpeg"} and content.startswith(b"\xff\xd8\xff"):
        return "IMAGE", "image/jpeg"
    if ext == "png" and content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "IMAGE", "image/png"
    if ext == "webp" and len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "IMAGE", "image/webp"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="El contenido del archivo no corresponde a una firma valida (PDF, JPG, PNG o WEBP)"
    )


def _sanitize_filename(filename: str | None) -> str:
    # Mantener solo caracteres seguros para encabezados HTTP
    base_name = Path(filename or "evidence").name
    sanitized = re.sub(r"[^A-Za-z0-9._-]", "_", base_name).strip(".")
    return sanitized or "evidence"


async def _cleanup_s3_objects(keys: list[str]) -> None:
    for key in keys:
        try:
            await run_in_threadpool(
                s3_client.delete_object,
                Bucket=settings.s3_bucket_name,
                Key=key,
            )
        except Exception as cleanup_exc:
            logger.warning("No se pudo limpiar objeto S3 %s tras rollback: %s", key, cleanup_exc)


def _stream_s3_body(body):
    try:
        yield from body.iter_chunks(chunk_size=65536)
    finally:
        body.close()


async def submit_provider_evidence(
    db: Session,
    provider_id: int,
    business_name: str,
    category: str,
    description: str,
    files: list[UploadFile]
) -> dict:
    clean_business_name = business_name.strip()
    clean_description = description.strip()
    if len(clean_business_name) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Razon social invalida")
    if len(clean_description) < 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Descripcion demasiado corta")

    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debe adjuntar evidencias")
    if len(files) > MAX_FILES_PER_AUDIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Se permite un maximo de {MAX_FILES_PER_AUDIT} archivos por auditoria"
        )

    prepared_files: list[dict] = []
    for file in files:
        if not file.filename or not file.filename.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nombre de archivo requerido")

        clean_filename = Path(file.filename).name.strip()
        if "." not in clean_filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Extension de archivo no permitida")

        ext = clean_filename.rsplit(".", 1)[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Extension .{ext} no permitida. Solo PDF, JPG, JPEG, PNG o WEBP"
            )

        content = await file.read(MAX_FILE_SIZE_BYTES + 1)
        if not content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se permiten archivos vacios")
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cada archivo debe pesar como maximo 10 MB"
            )

        file_type, canonical_content_type = _detect_file_metadata(ext, content)
        prepared_files.append({
            "file_name": clean_filename[:255],
            "ext": ext,
            "file_type": file_type,
            "content_type": canonical_content_type,
            "content": content,
        })

    await run_in_threadpool(ensure_bucket_exists)

    uploaded_keys: list[str] = []
    try:
        audit = SustainabilityAudit(
            provider_id=provider_id,
            business_name=clean_business_name,
            category=str(normalize_category(category)),
            description=clean_description,
            status="PENDING"
        )
        db.add(audit)
        db.flush()

        for item in prepared_files:
            object_key = f"audits/{provider_id}/{audit.id}/{uuid.uuid4()}.{item['ext']}"
            await run_in_threadpool(
                s3_client.put_object,
                Bucket=settings.s3_bucket_name,
                Key=object_key,
                Body=item["content"],
                ContentType=item["content_type"],
            )
            uploaded_keys.append(object_key)

            db.add(AuditEvidenceFile(
                audit_id=audit.id,
                file_name=item["file_name"],
                file_type=item["file_type"],
                s3_object_key=object_key
            ))

        await run_in_threadpool(db.commit)
    except HTTPException:
        db.rollback()
        await _cleanup_s3_objects(uploaded_keys)
        raise
    except Exception as exc:
        db.rollback()
        await _cleanup_s3_objects(uploaded_keys)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al registrar evidencias: {exc}"
        )

    return {"audit_id": audit.id, "status": "PENDING", "files_uploaded": len(prepared_files)}


def _load_files_by_audit(db: Session, audit_ids: list[int]) -> dict[int, list[AuditEvidenceFile]]:
    if not audit_ids:
        return {}
    files = (
        db.query(AuditEvidenceFile)
        .filter(AuditEvidenceFile.audit_id.in_(audit_ids))
        .all()
    )
    grouped: dict[int, list[AuditEvidenceFile]] = defaultdict(list)
    for evidence in files:
        grouped[evidence.audit_id].append(evidence)
    return grouped


def list_provider_audits(
    db: Session,
    provider_id: int,
    limit: int = 50,
    offset: int = 0
) -> list[dict]:
    audits = (
        db.query(SustainabilityAudit)
        .filter(SustainabilityAudit.provider_id == provider_id)
        .order_by(SustainabilityAudit.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    files_by_audit = _load_files_by_audit(db, [a.id for a in audits])

    return [
        {
            "id": a.id,
            "business_name": a.business_name,
            "category": a.category,
            "description": a.description,
            "status": a.status,
            "reviewer_notes": a.reviewer_notes,
            "created_at": a.created_at,
            "files_count": len(files_by_audit.get(a.id, [])),
        }
        for a in audits
    ]


def list_pending_audits(
    db: Session,
    category: str | None = None,
    limit: int = 50,
    offset: int = 0
) -> list[dict]:
    query = db.query(SustainabilityAudit).filter(SustainabilityAudit.status == "PENDING")
    if category:
        query = query.filter(SustainabilityAudit.category == str(normalize_category(category)))

    audits = (
        query.order_by(SustainabilityAudit.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    files_by_audit = _load_files_by_audit(db, [a.id for a in audits])

    return [
        {
            "id": a.id,
            "provider_id": a.provider_id,
            "business_name": a.business_name,
            "category": a.category,
            "description": a.description,
            "status": a.status,
            "created_at": a.created_at,
            "files": [
                {"id": f.id, "file_name": f.file_name, "file_type": f.file_type}
                for f in files_by_audit.get(a.id, [])
            ]
        }
        for a in audits
    ]


def get_evidence_file_response(db: Session, file_id: int) -> StreamingResponse:
    evidence = db.query(AuditEvidenceFile).filter(AuditEvidenceFile.id == file_id).first()
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo de evidencia no encontrado")

    try:
        s3_obj = s3_client.get_object(Bucket=settings.s3_bucket_name, Key=evidence.s3_object_key)
    except ClientError as exc:
        code = str(exc.response.get("Error", {}).get("Code", ""))
        if code in {"NoSuchKey", "404", "NotFound"}:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado en S3")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Error al leer S3: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Error al leer S3: {exc}")

    media_type = s3_obj.get("ContentType") or (
        "application/pdf" if evidence.file_type == "PDF" else "image/jpeg"
    )
    safe_name = _sanitize_filename(evidence.file_name)
    headers = {"X-Content-Type-Options": "nosniff"}
    if media_type in SAFE_INLINE_MEDIA_TYPES:
        headers["Content-Security-Policy"] = "sandbox"
        headers["Content-Disposition"] = f'inline; filename="{safe_name}"'
    else:
        headers["Content-Disposition"] = f'attachment; filename="{safe_name}"'

    return StreamingResponse(
        _stream_s3_body(s3_obj["Body"]),
        media_type=media_type,
        headers=headers
    )


def resolve_audit(db: Session, audit_id: int, admin_id: int, decision_data: AuditDecisionRequest) -> dict:
    audit = db.query(SustainabilityAudit).filter(SustainabilityAudit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auditoria no encontrada")

    if audit.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La auditoria ya fue dictaminada")

    audit.status = decision_data.decision
    audit.reviewer_notes = decision_data.reviewer_notes
    audit.reviewed_by = admin_id

    if decision_data.decision == "APPROVED":
        # Activar experiencias vinculadas directamente a esta auditoria
        db.query(Experience).filter(
            Experience.audit_id == audit.id,
            Experience.is_active.is_(False)
        ).update({"is_active": True}, synchronize_session=False)

        # Fallback compatible para experiencias legacy sin audit_id si no hubo auditoria previa rechazada
        has_prior_rejection = (
            db.query(SustainabilityAudit.id)
            .filter(
                SustainabilityAudit.provider_id == audit.provider_id,
                SustainabilityAudit.status == "REJECTED",
                SustainabilityAudit.id < audit.id,
            )
            .first()
            is not None
        )
        if not has_prior_rejection:
            db.query(Experience).filter(
                Experience.provider_id == audit.provider_id,
                Experience.audit_id.is_(None),
                Experience.is_active.is_(False)
            ).update({"is_active": True}, synchronize_session=False)

    db.commit()
    return {"audit_id": audit.id, "new_status": audit.status}
