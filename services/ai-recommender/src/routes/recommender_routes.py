from fastapi import APIRouter
from src.schemas.ai_schema import RecommendationRequest, ChatAssistantRequest
from src.controllers.recommender_controller import (
    generate_recommendations,
    process_conversational_query
)

router = APIRouter(prefix="/assistant", tags=["AI Recommendations & Chat"])


@router.post("/recommendations")
async def get_personalized_recommendations(prefs: RecommendationRequest):
    # Generar lista de experiencias recomendadas con justificacion breve
    return await generate_recommendations(prefs)


@router.post("/chat")
async def ask_ai_assistant(query: ChatAssistantRequest):
    # Responder consulta conversacional con sugerencias concretas del catalogo
    return await process_conversational_query(query)