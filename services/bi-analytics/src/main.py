from contextlib import asynccontextmanager
import logging
import threading
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from src.config.database import Base, engine
from src.consumers.booking_consumer import start_consumer_thread
from src.routes.health_routes import router as health_router
from src.routes.analytics_routes import router as analytics_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas analiticas y migraciones incrementales con reintentos ante arranque de PostgreSQL
    max_attempts = 5
    for attempt in range(1, max_attempts + 1):
        try:
            Base.metadata.create_all(bind=engine)
            if engine.dialect.name == "postgresql":
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE booking_metric_records ADD COLUMN IF NOT EXISTS adults_count INTEGER NOT NULL DEFAULT 1;"))
                    conn.execute(text("ALTER TABLE booking_metric_records ADD COLUMN IF NOT EXISTS children_count INTEGER NOT NULL DEFAULT 0;"))
                    conn.execute(text("ALTER TABLE booking_metric_records ADD COLUMN IF NOT EXISTS seniors_count INTEGER NOT NULL DEFAULT 0;"))
                    conn.execute(text("ALTER TABLE booking_metric_records ADD COLUMN IF NOT EXISTS students_count INTEGER NOT NULL DEFAULT 0;"))
            break
        except Exception as exc:
            logger.warning("Intento %s/%s de inicializar BD fallo: %s", attempt, max_attempts, exc)
            if attempt == max_attempts:
                raise
            time.sleep(2)

    # Iniciar consumidor de eventos RabbitMQ y garantizar cierre limpio al apagar
    stop_event = threading.Event()
    consumer_thread = start_consumer_thread(stop_event)
    try:
        yield
    finally:
        stop_event.set()
        consumer_thread.join(timeout=5)


# Inicializar aplicacion FastAPI con ciclo de vida gestionado
app = FastAPI(title="BI & Analytics Microservice", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar enrutadores del dominio
app.include_router(health_router)
app.include_router(analytics_router)
