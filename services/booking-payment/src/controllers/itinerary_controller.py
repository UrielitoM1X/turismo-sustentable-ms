from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from src.models.booking_model import FavoriteExperience, Itinerary, ItineraryItem
from src.schemas.booking_schema import ItineraryCreateRequest, ItineraryItemAddRequest


def toggle_favorite(db: Session, tourist_id: int, experience_id: int) -> dict:
    # Agregar o quitar experiencia de favoritos del turista
    existing = db.query(FavoriteExperience).filter(
        FavoriteExperience.tourist_id == tourist_id,
        FavoriteExperience.experience_id == experience_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"experience_id": experience_id, "is_favorite": False}

    try:
        db.add(FavoriteExperience(tourist_id=tourist_id, experience_id=experience_id))
        db.commit()
        return {"experience_id": experience_id, "is_favorite": True}
    except IntegrityError:
        db.rollback()
        return {"experience_id": experience_id, "is_favorite": True}


def list_favorites(db: Session, tourist_id: int) -> dict:
    # Listar identificadores de experiencias favoritas del turista
    rows = db.query(FavoriteExperience.experience_id).filter(
        FavoriteExperience.tourist_id == tourist_id
    ).order_by(FavoriteExperience.saved_at.desc()).all()
    return {"favorite_experience_ids": [row[0] for row in rows]}


def create_itinerary(db: Session, tourist_id: int, data: ItineraryCreateRequest) -> dict:
    # Crear nuevo itinerario personal
    itinerary = Itinerary(tourist_id=tourist_id, title=data.title)
    db.add(itinerary)
    db.commit()
    db.refresh(itinerary)
    return {"id": itinerary.id, "title": itinerary.title}


def add_item_to_itinerary(db: Session, tourist_id: int, itinerary_id: int, item: ItineraryItemAddRequest) -> dict:
    # Verificar propiedad del itinerario y agregar experiencia
    itinerary = db.query(Itinerary).filter(
        Itinerary.id == itinerary_id,
        Itinerary.tourist_id == tourist_id
    ).first()

    if not itinerary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Itinerario no encontrado")

    new_item = ItineraryItem(
        itinerary_id=itinerary.id,
        experience_id=item.experience_id,
        planned_date=item.planned_date
    )
    db.add(new_item)
    db.commit()
    return {"itinerary_id": itinerary.id, "experience_id": item.experience_id, "added": True}