from fastapi import HTTPException, status
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKTElement
from sqlalchemy import cast, func
from sqlalchemy.orm import Session
from src.models.catalog_model import Experience, SustainabilityAudit
from src.schemas.catalog_schema import (
    CDMX_BOROUGHS,
    ExperienceCreateRequest,
    normalize_borough,
    normalize_category,
)


def _serialize_experience(exp: Experience, latitude: float, longitude: float) -> dict:
    return {
        "id": exp.id,
        "provider_id": exp.provider_id,
        "audit_id": exp.audit_id,
        "title": exp.title,
        "description": exp.description,
        "category": exp.category,
        "borough_cdmx": exp.borough_cdmx,
        "latitude": float(latitude),
        "longitude": float(longitude),
        "duration_minutes": exp.duration_minutes,
        "price": exp.price,
        "max_capacity": exp.max_capacity,
        "pet_friendly": exp.pet_friendly,
        "accessible": exp.accessible,
        "sustainable_practices": exp.sustainable_practices,
        "is_active": exp.is_active,
    }


def _query_with_coords(db: Session):
    return db.query(
        Experience,
        func.ST_Y(cast(Experience.location, Geometry)).label("latitude"),
        func.ST_X(cast(Experience.location, Geometry)).label("longitude"),
    )


def create_experience(db: Session, provider_id: int, data: ExperienceCreateRequest) -> dict:
    # Asociar al ultimo SustainabilityAudit en estado PENDING o APPROVED
    latest_audit = (
        db.query(SustainabilityAudit)
        .filter(
            SustainabilityAudit.provider_id == provider_id,
            SustainabilityAudit.status.in_(["PENDING", "APPROVED"])
        )
        .order_by(SustainabilityAudit.created_at.desc(), SustainabilityAudit.id.desc())
        .first()
    )

    if not latest_audit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes adjuntar evidencias ambientales antes de registrar la actividad"
        )

    canonical_borough = normalize_borough(data.borough_cdmx)
    if canonical_borough not in CDMX_BOROUGHS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La experiencia debe ubicarse dentro de una alcaldia valida de la CDMX"
        )

    geo_point = WKTElement(f"POINT({data.longitude} {data.latitude})", srid=4326)
    is_active = latest_audit.status == "APPROVED"

    # Si la auditoria ya fue aprobada nace activa; si esta pendiente espera dictamen
    experience = Experience(
        provider_id=provider_id,
        audit_id=latest_audit.id,
        title=data.title.strip(),
        description=data.description.strip(),
        category=data.category,
        borough_cdmx=canonical_borough,
        location=geo_point,
        duration_minutes=data.duration_minutes,
        price=data.price,
        max_capacity=data.max_capacity,
        pet_friendly=data.pet_friendly,
        accessible=data.accessible,
        sustainable_practices=data.sustainable_practices.strip(),
        is_active=is_active
    )
    db.add(experience)
    db.commit()
    db.refresh(experience)

    return {
        "id": experience.id,
        "title": experience.title,
        "borough_cdmx": experience.borough_cdmx,
        "is_active": experience.is_active,
        "audit_id": experience.audit_id,
    }


def search_experiences(
    db: Session,
    q: str | None = None,
    category: str | None = None,
    borough: str | None = None,
    pet_friendly: bool | None = None,
    accessible: bool | None = None,
    limit: int = 50,
    offset: int = 0
) -> list[dict]:
    query = _query_with_coords(db).filter(Experience.is_active.is_(True))

    if q:
        query = query.filter(Experience.title.ilike(f"%{q}%"))
    if category:
        query = query.filter(Experience.category == str(normalize_category(category)))
    if borough:
        query = query.filter(Experience.borough_cdmx == normalize_borough(borough))
    if pet_friendly is not None:
        query = query.filter(Experience.pet_friendly == pet_friendly)
    if accessible is not None:
        query = query.filter(Experience.accessible == accessible)

    results = (
        query.order_by(Experience.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_serialize_experience(exp, lat, lon) for exp, lat, lon in results]


def get_experience_by_id(
    db: Session,
    experience_id: int,
    include_inactive: bool = False
) -> dict:
    query = _query_with_coords(db).filter(Experience.id == experience_id)
    if not include_inactive:
        query = query.filter(Experience.is_active.is_(True))

    row = query.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experiencia no encontrada"
        )

    exp, lat, lon = row
    return _serialize_experience(exp, lat, lon)
