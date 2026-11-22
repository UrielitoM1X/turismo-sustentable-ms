from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.utils.auth_guard import verify_jwt_token
from src.schemas.catalog_schema import AuditDecisionRequest
from src.controllers.audit_controller import (
    submit_provider_evidence,
    list_pending_audits,
    resolve_audit
)

router = APIRouter(prefix="/audits", tags=["Sustainability Audits"])


@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def upload_evidences(
    business_name: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    files: list[UploadFile] = File(...),
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Permitir a proveedores cargar evidencias ambientales y certificaciones
    if payload.get("role") != "PROVIDER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo proveedores pueden subir evidencias")
    return await submit_provider_evidence(db, int(payload["sub"]), business_name, category, description, files)


@router.get("/pending")
def get_pending(
    category: str | None = None,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Listar auditorias pendientes para revision del administrador
    if payload.get("role") != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso exclusivo para administradores")
    return list_pending_audits(db, category)


@router.patch("/{audit_id}/decision")
def decide_audit(
    audit_id: int,
    decision_data: AuditDecisionRequest,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Aprobar o rechazar solicitud de sustentabilidad
    if payload.get("role") != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso exclusivo para administradores")
    return resolve_audit(db, audit_id, int(payload["sub"]), decision_data)