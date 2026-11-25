from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.config.database import get_db
from src.utils.auth_guard import verify_jwt_token
from src.schemas.booking_schema import ItineraryCreateRequest, ItineraryItemAddRequest
from src.controllers.itinerary_controller import (
    toggle_favorite,
    list_favorites,
    create_itinerary,
    add_item_to_itinerary
)

router = APIRouter(prefix="/planning", tags=["Favorites & Itineraries"])


@router.get("/favorites")
def get_favorites(
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Listar experiencias favoritas del turista autenticado
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso exclusivo para turistas")
    return list_favorites(db, int(payload["sub"]))


@router.post("/favorites/{experience_id}")
def favorite_experience(
    experience_id: int,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Alternar estado de favorito de una experiencia
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso exclusivo para turistas")
    return toggle_favorite(db, int(payload["sub"]), experience_id)


@router.post("/itineraries", status_code=status.HTTP_201_CREATED)
def new_itinerary(
    data: ItineraryCreateRequest,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Crear itinerario personalizado
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso exclusivo para turistas")
    return create_itinerary(db, int(payload["sub"]), data)


@router.post("/itineraries/{itinerary_id}/items")
def append_itinerary_item(
    itinerary_id: int,
    item: ItineraryItemAddRequest,
    payload: dict = Depends(verify_jwt_token),
    db: Session = Depends(get_db)
):
    # Agregar experiencia a itinerario existente
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso exclusivo para turistas")
    return add_item_to_itinerary(db, int(payload["sub"]), itinerary_id, item)