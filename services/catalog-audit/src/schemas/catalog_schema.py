from pydantic import BaseModel, Field
from typing import Literal, Optional

# Definir catalogo oficial de las 16 alcaldias de la Ciudad de Mexico
CDMX_BOROUGHS = {
    "Alvaro Obregon", "Azcapotzalco", "Benito Juarez", "Coyoacan",
    "Cuajimalpa de Morelos", "Cuauhtemoc", "Gustavo A. Madero", "Iztacalco",
    "Iztapalapa", "La Magdalena Contreras", "Miguel Hidalgo", "Milpa Alta",
    "Tlahuac", "Tlalpan", "Venustiano Carranza", "Xochimilco"
}


class AuditDecisionRequest(BaseModel):
    # Validar resolucion del administrador sobre evidencias ambientales
    decision: Literal["APPROVED", "REJECTED"]
    reviewer_notes: Optional[str] = Field(default=None, max_length=500)


class ExperienceCreateRequest(BaseModel):
    # Validar datos para publicar experiencia turistica en CDMX
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20)
    category: Literal["Naturaleza", "Gastronomia", "Cultura", "Viajes Tranquilos"]
    borough_cdmx: str
    latitude: float = Field(ge=19.04, le=19.60)
    longitude: float = Field(ge=-99.37, le=-98.94)
    duration_minutes: int = Field(gt=0)
    price: float = Field(ge=0)
    max_capacity: int = Field(gt=0, le=50)
    pet_friendly: bool = False
    accessible: bool = False
    sustainable_practices: str = Field(min_length=10)