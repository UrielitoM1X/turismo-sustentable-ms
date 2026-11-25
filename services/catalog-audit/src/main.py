from contextlib import asynccontextmanager
import logging
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from src.config.database import Base, engine
from src.models import catalog_model  # noqa: F401
from src.routes.health_routes import router as health_router
from src.routes.audit_routes import router as audit_router
from src.routes.experience_routes import router as experience_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Habilitar PostGIS, crear tablas y aplicar migracion compatible de audit_id con reintentos
    for attempt in range(1, 11):
        try:
            with engine.begin() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            Base.metadata.create_all(bind=engine)
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE experiences "
                        "ADD COLUMN IF NOT EXISTS audit_id INTEGER REFERENCES sustainability_audits(id);"
                    )
                )
            break
        except Exception as exc:
            logger.warning("Intento %s/10 al inicializar catalog-audit BD fallo: %s", attempt, exc)
            if attempt == 10:
                raise
            time.sleep(2)
    yield


# Inicializar aplicacion FastAPI
app = FastAPI(title="Catalog & Sustainability Audit Microservice", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar enrutadores del dominio
app.include_router(health_router)
app.include_router(audit_router)
app.include_router(experience_router)