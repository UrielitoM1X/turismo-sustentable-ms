from fastapi import APIRouter
from src.controllers.health_controller import get_service_status

router = APIRouter()


@router.get("/health")
def health_check():
    # Exponer endpoint de verificacion de estado
    return get_service_status()