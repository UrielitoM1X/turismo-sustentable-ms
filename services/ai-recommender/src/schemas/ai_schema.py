from pydantic import BaseModel, Field
from typing import Optional


class RecommendationRequest(BaseModel):
    # Validar intereses, accesibilidad y mascotas del turista
    travel_interests: list[str] = Field(default_factory=list)
    preferred_borough: Optional[str] = None
    requires_accessibility: bool = False
    with_pets: bool = False
    max_budget: Optional[float] = Field(default=None, ge=0)


class ChatAssistantRequest(BaseModel):
    # Validar consulta conversacional enviada desde la burbuja de IA
    message: str = Field(min_length=2, max_length=600)
    travel_interests: list[str] = Field(default_factory=list)