from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.utils.auth_guard import verify_jwt_token
from src.controllers.analytics_controller import (
    get_admin_bi_dashboard,
    get_provider_bi_dashboard,
)

router = APIRouter(prefix="/dashboard", tags=["Admin Business Intelligence"])


@router.get("/summary")
def get_bi_summary(
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Entregar metricas consolidadas exclusivamente al rol Administrador
    if payload.get("role") != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso exclusivo para administradores")
    return get_admin_bi_dashboard(db)


@router.get("/provider")
def get_provider_bi_summary(
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Entregar monitoreo y metricas operativas exclusivas del proveedor autenticado
    if payload.get("role") != "PROVIDER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso exclusivo para proveedores")
    return get_provider_bi_dashboard(db, int(payload["sub"]))