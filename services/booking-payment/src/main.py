from contextlib import asynccontextmanager
import logging
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from src.config.database import Base, engine
from src.routes.health_routes import router as health_router
from src.routes.booking_routes import router as booking_router
from src.routes.itinerary_routes import router as itinerary_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializar tablas y migraciones incrementales con reintentos ante arranque de PostgreSQL
    max_attempts = 5
    for attempt in range(1, max_attempts + 1):
        try:
            Base.metadata.create_all(bind=engine)
            if engine.dialect.name == "postgresql":
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;"))
                    conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adults_count INTEGER NOT NULL DEFAULT 1;"))
                    conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS children_count INTEGER NOT NULL DEFAULT 0;"))
                    conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seniors_count INTEGER NOT NULL DEFAULT 0;"))
                    conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS students_count INTEGER NOT NULL DEFAULT 0;"))
                    conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_breakdown JSON;"))
                    conn.execute(text("""
                        UPDATE bookings
                        SET adults_count = guests_count,
                            guest_breakdown = json_build_object(
                                'adults', guests_count,
                                'children', 0,
                                'seniors', 0,
                                'students', 0
                            )
                        WHERE guest_breakdown IS NULL;
                    """))
            break
        except Exception as exc:
            logger.warning("Intento %s/%s de inicializar BD fallo: %s", attempt, max_attempts, exc)
            if attempt == max_attempts:
                raise
            time.sleep(2)
    yield


# Inicializar aplicacion FastAPI
app = FastAPI(title="Booking & Payment Microservice", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar enrutadores del dominio
app.include_router(health_router)
app.include_router(booking_router)
app.include_router(itinerary_router)
