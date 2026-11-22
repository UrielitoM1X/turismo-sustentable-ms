from fastapi import FastAPI
from src.routes.health_routes import router as health_router
from src.routes.recommender_routes import router as recommender_router

# Inicializar aplicacion FastAPI
app = FastAPI(title="AI Recommender & Conversational Assistant Microservice")

# Registrar enrutadores del dominio
app.include_router(health_router)
app.include_router(recommender_router)