from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.utils.auth_guard import verify_jwt_token
from src.schemas.catalog_schema import ExperienceCreateRequest
from src.controllers.experience_controller import create_experience, search_experiences

router = APIRouter(prefix="/experiences", tags=["Sustainable Experiences"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def publish_experience(
    data: ExperienceCreateRequest,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    if payload.get("role") != "PROVIDER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo proveedores pueden publicar experiencias")
    return create_experience(db, int(payload["sub"]), data)


@router.get("/")
def list_experiences(
    q: str | None = None,
    category: str | None = None,
    borough: str | None = None,
    pet_friendly: bool | None = None,
    accessible: bool | None = None,
    db: Session = Depends(get_db)
):
    return search_experiences(db, q, category, borough, pet_friendly, accessible)
