from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.utils.auth_guard import verify_jwt_token
from src.controllers.analytics_controller import get_admin_bi_dashboard

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