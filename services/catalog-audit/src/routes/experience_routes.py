from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.utils.auth_guard import verify_jwt_token
from src.schemas.catalog_schema import ExperienceCreateRequest
from src.controllers.experience_controller import (
    create_experience,
    get_experience_by_id,
    search_experiences,
)

router = APIRouter(prefix="/experiences", tags=["Sustainable Experiences"])


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def publish_experience(
    data: ExperienceCreateRequest,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    if payload.get("role") != "PROVIDER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo proveedores pueden publicar experiencias")
    return create_experience(db, int(payload["sub"]), data)


@router.get("")
@router.get("/", include_in_schema=False)
def list_experiences(
    q: str | None = None,
    category: str | None = None,
    borough: str | None = None,
    pet_friendly: bool | None = None,
    accessible: bool | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    return search_experiences(
        db,
        q,
        category,
        borough,
        pet_friendly,
        accessible,
        limit=limit,
        offset=offset,
    )


@router.get("/{experience_id}")
def get_experience(
    experience_id: int,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    return get_experience_by_id(db, experience_id, include_inactive=include_inactive)
