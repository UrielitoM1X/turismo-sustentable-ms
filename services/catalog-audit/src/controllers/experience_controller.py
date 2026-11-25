from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from geoalchemy2.elements import WKTElement
from src.models.catalog_model import Experience, SustainabilityAudit
from src.schemas.catalog_schema import ExperienceCreateRequest, CDMX_BOROUGHS


def create_experience(db: Session, provider_id: int, data: ExperienceCreateRequest) -> dict:
    # Verificar que el proveedor tenga al menos una auditoria enviada (PENDING o APPROVED)
    has_audit = db.query(SustainabilityAudit).filter(
        SustainabilityAudit.provider_id == provider_id,
        SustainabilityAudit.status.in_(["PENDING", "APPROVED"])
    ).first()

    if not has_audit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes adjuntar evidencias ambientales antes de registrar la actividad"
        )

    if data.borough_cdmx not in CDMX_BOROUGHS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La experiencia debe ubicarse dentro de una alcaldia valida de la CDMX"
        )

    geo_point = WKTElement(f"POINT({data.longitude} {data.latitude})", srid=4326)

    # Nace inactiva (is_active=False) hasta que el Administrador apruebe la auditoria
    experience = Experience(
        provider_id=provider_id,
        title=data.title,
        description=data.description,
        category=data.category,
        borough_cdmx=data.borough_cdmx,
        location=geo_point,
        duration_minutes=data.duration_minutes,
        price=data.price,
        max_capacity=data.max_capacity,
        pet_friendly=data.pet_friendly,
        accessible=data.accessible,
        sustainable_practices=data.sustainable_practices,
        is_active=False
    )
    db.add(experience)
    db.commit()
    db.refresh(experience)

    return {
        "id": experience.id,
        "title": experience.title,
        "borough_cdmx": experience.borough_cdmx,
        "is_active": experience.is_active
    }


def search_experiences(
    db: Session,
    q: str | None = None,
    category: str | None = None,
    borough: str | None = None,
    pet_friendly: bool | None = None,
    accessible: bool | None = None
) -> list[dict]:
    query = db.query(Experience).filter(Experience.is_active.is_(True))

    if q:
        query = query.filter(Experience.title.ilike(f"%{q}%"))
    if category:
        query = query.filter(Experience.category == category)
    if borough:
        query = query.filter(Experience.borough_cdmx == borough)
    if pet_friendly is not None:
        query = query.filter(Experience.pet_friendly == pet_friendly)
    if accessible is not None:
        query = query.filter(Experience.accessible == accessible)

    results = query.all()
    return [
        {
            "id": exp.id,
            "provider_id": exp.provider_id,
            "title": exp.title,
            "category": exp.category,
            "borough_cdmx": exp.borough_cdmx,
            "duration_minutes": exp.duration_minutes,
            "price": exp.price,
            "max_capacity": exp.max_capacity,
            "pet_friendly": exp.pet_friendly,
            "accessible": exp.accessible,
            "sustainable_practices": exp.sustainable_practices
        }
        for exp in results
    ]
