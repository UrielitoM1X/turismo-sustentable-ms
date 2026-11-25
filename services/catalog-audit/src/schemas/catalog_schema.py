import unicodedata
from typing import Annotated, Literal, Optional
from pydantic import BaseModel, BeforeValidator, Field

# Definir catalogo oficial de las 16 alcaldias de la Ciudad de Mexico
CDMX_BOROUGHS = {
    "Alvaro Obregon", "Azcapotzalco", "Benito Juarez", "Coyoacan",
    "Cuajimalpa de Morelos", "Cuauhtemoc", "Gustavo A. Madero", "Iztacalco",
    "Iztapalapa", "La Magdalena Contreras", "Miguel Hidalgo", "Milpa Alta",
    "Tlahuac", "Tlalpan", "Venustiano Carranza", "Xochimilco"
}

VALID_CATEGORIES = ("Naturaleza", "Gastronomia", "Cultura", "Viajes Tranquilos")
CategoryLiteral = Literal["Naturaleza", "Gastronomia", "Cultura", "Viajes Tranquilos"]


def strip_accents(value: str) -> str:
    # Normalizar texto Unicode y remover tildes para comparacion canonica
    normalized = unicodedata.normalize("NFKD", value.strip())
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


_CATEGORY_MAP = {strip_accents(cat).lower(): cat for cat in VALID_CATEGORIES}
_BOROUGH_MAP = {strip_accents(borough).lower(): borough for borough in CDMX_BOROUGHS}


def normalize_category(value: object) -> object:
    # Convertir categoria con o sin tilde al valor canonico esperado
    if isinstance(value, str):
        key = strip_accents(value).lower()
        return _CATEGORY_MAP.get(key, value.strip())
    return value


def normalize_borough(value: str) -> str:
    # Convertir alcaldia con o sin tilde al nombre canonico de CDMX_BOROUGHS
    key = strip_accents(value).lower()
    return _BOROUGH_MAP.get(key, strip_accents(value))


NormalizedCategory = Annotated[CategoryLiteral, BeforeValidator(normalize_category)]


class AuditDecisionRequest(BaseModel):
    # Validar resolucion del administrador sobre evidencias ambientales
    decision: Literal["APPROVED", "REJECTED"]
    reviewer_notes: Optional[str] = Field(default=None, max_length=500)


class ExperienceCreateRequest(BaseModel):
    # Validar datos para publicar experiencia turistica en CDMX
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20)
    category: NormalizedCategory
    borough_cdmx: str
    latitude: float = Field(ge=19.04, le=19.60)
    longitude: float = Field(ge=-99.37, le=-98.94)
    duration_minutes: int = Field(gt=0)
    price: float = Field(ge=0)
    max_capacity: int = Field(gt=0, le=50)
    pet_friendly: bool = False
    accessible: bool = False
    sustainable_practices: str = Field(min_length=10)