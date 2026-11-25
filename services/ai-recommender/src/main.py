from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.health_routes import router as health_router
from src.routes.recommender_routes import router as recommender_router

# Inicializar aplicacion FastAPI
app = FastAPI(title="AI Recommender & Conversational Assistant Microservice")

# Configurar CORS para permitir peticiones desde clientes web autorizados
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar enrutadores del dominio
app.include_router(health_router)
app.include_router(recommender_router)