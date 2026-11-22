from src.schemas.ai_schema import RecommendationRequest, ChatAssistantRequest
from src.utils.catalog_client import fetch_active_experiences


def _score_experience(exp: dict, prefs: RecommendationRequest) -> tuple[int, list[str]]:
    # Calcular puntaje de afinidad y generar razones explicables para la UI
    score = 0
    reasons = []

    if exp.get("category") in prefs.travel_interests:
        score += 40
        reasons.append(f"Coincide con tu interes en {exp.get('category')}")

    if prefs.preferred_borough and exp.get("borough_cdmx") == prefs.preferred_borough:
        score += 25
        reasons.append(f"Ubicada en tu zona preferida ({prefs.preferred_borough})")

    if prefs.requires_accessibility:
        if exp.get("accessible"):
            score += 20
            reasons.append("Cuenta con accesibilidad verificada")
        else:
            score -= 50

    if prefs.with_pets:
        if exp.get("pet_friendly"):
            score += 20
            reasons.append("Actividad apta para asistir con mascotas")
        else:
            score -= 50

    if prefs.max_budget is not None and exp.get("price", 0) <= prefs.max_budget:
        score += 15
        reasons.append("Dentro de tu presupuesto estimado")

    if not reasons:
        reasons.append("Experiencia sustentable destacada en CDMX")

    return score, reasons


async def generate_recommendations(prefs: RecommendationRequest) -> dict:
    # Obtener catalogo vigente y ordenar experiencias por afinidad explicable
    experiences = await fetch_active_experiences()
    scored_results = []

    for exp in experiences:
        score, reasons = _score_experience(exp, prefs)
        if score >= 0:
            scored_results.append({
                "experience": exp,
                "affinity_score": score,
                "explanation": " | ".join(reasons)
            })

    scored_results.sort(key=lambda item: item["affinity_score"], reverse=True)
    return {
        "total_recommended": len(scored_results[:6]),
        "recommendations": scored_results[:6]
    }


async def process_conversational_query(query: ChatAssistantRequest) -> dict:
    # Interpretar intencion del mensaje y sugerir experiencias concretas
    experiences = await fetch_active_experiences()
    text = query.message.lower()

    # Detectar palabras clave de filtros en lenguaje natural
    detected_category = None
    if any(word in text for word in ["naturaleza", "bosque", "chinampa", "aire libre", "senderismo"]):
        detected_category = "Naturaleza"
    elif any(word in text for word in ["comida", "gastronomia", "taller", "cocina", "cafe"]):
        detected_category = "Gastronomia"
    elif any(word in text for word in ["cultura", "historia", "museo", "artesania", "barrio"]):
        detected_category = "Cultura"
    elif any(word in text for word in ["tranquilo", "relajar", "descanso", "silencio"]):
        detected_category = "Viajes Tranquilos"

    with_pets = any(word in text for word in ["perro", "mascota", "lomito"])
    accessible = any(word in text for word in ["accesible", "silla de ruedas", "movilidad"])

    prefs = RecommendationRequest(
        travel_interests=[detected_category] if detected_category else query.travel_interests,
        requires_accessibility=accessible,
        with_pets=with_pets
    )
    rec_data = await generate_recommendations(prefs)
    suggestions = rec_data["recommendations"][:3]

    if not suggestions:
        reply = (
            "Aun no encontre experiencias publicadas con esos criterios exactos en CDMX. "
            "Prueba explorar categorias como Naturaleza, Gastronomia o Cultura."
        )
    else:
        titles = ", ".join([item["experience"]["title"] for item in suggestions])
        reply = (
            f"Basado en lo que buscas, se sugiero revisar estas opciones sustentables en CDMX: {titles}. "
            "Todas cuentan con validacion ambiental aprobada y control de cupo ecologico."
        )

    return {
        "assistant_reply": reply,
        "suggested_experiences": suggestions
    }