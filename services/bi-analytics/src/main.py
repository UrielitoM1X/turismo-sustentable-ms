from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.config.database import Base, engine
from src.consumers.booking_consumer import start_consumer_thread
from src.routes.health_routes import router as health_router
from src.routes.analytics_routes import router as analytics_router

# Crear tablas analiticas en PostgreSQL
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Iniciar consumidor de eventos RabbitMQ al arrancar aplicacion
    start_consumer_thread()
    yield


# Inicializar aplicacion FastAPI con ciclo de vida gestionado
app = FastAPI(title="BI & Analytics Microservice", lifespan=lifespan)

# Registrar enrutadores del dominio
app.include_router(health_router)
app.include_router(analytics_router)