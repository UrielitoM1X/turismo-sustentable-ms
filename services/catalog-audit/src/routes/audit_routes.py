from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.utils.auth_guard import verify_jwt_token
from src.schemas.catalog_schema import AuditDecisionRequest, NormalizedCategory
from src.controllers.audit_controller import (
    submit_provider_evidence,
    list_provider_audits,
    list_pending_audits,
    resolve_audit,
    get_evidence_file_response
)

router = APIRouter(prefix="/audits", tags=["Sustainability Audits"])


@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    business_name: str = Form(..., min_length=2, max_length=200),
    category: NormalizedCategory = Form(...),
    description: str = Form(..., min_length=5, max_length=2000),
    files: list[UploadFile] = File(...),
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    if payload.get("role") != "PROVIDER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo proveedores pueden enviar evidencias")
    return await submit_provider_evidence(db, int(payload["sub"]), business_name, category, description, files)


@router.get("/my-audits")
def get_my_audits(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    if payload.get("role") != "PROVIDER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo proveedores pueden consultar sus solicitudes")
    return list_provider_audits(db, int(payload["sub"]), limit=limit, offset=offset)


@router.get("/pending")
def get_pending_audits(
    category: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    if payload.get("role") != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo administradores pueden auditar")
    return list_pending_audits(db, category, limit=limit, offset=offset)


@router.get("/files/{file_id}")
def view_evidence_file(
    file_id: int,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    if payload.get("role") != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo administradores pueden ver evidencias")
    return get_evidence_file_response(db, file_id)


@router.patch("/{audit_id}/decision")
def decide_audit(
    audit_id: int,
    decision_data: AuditDecisionRequest,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    if payload.get("role") != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo administradores pueden dictaminar")
    return resolve_audit(db, audit_id, int(payload["sub"]), decision_data)
