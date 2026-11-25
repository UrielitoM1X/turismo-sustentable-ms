from contextlib import asynccontextmanager
import logging
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from src.config.database import Base, SessionLocal, engine
from src.models.user_model import ProviderProfile, TouristProfile, User
from src.routes.health_routes import router as health_router
from src.routes.auth_routes import router as auth_router
from src.utils.security import hash_password

logger = logging.getLogger(__name__)


def _seed_demo_accounts() -> None:
    # Insertar cuentas demo de forma idempotente si aun no existen
    demo_accounts = [
        {
            "email": "admin@turismosustentable.mx",
            "password": "AdminTS2026!",
            "full_name": "Ana Martinez (Admin)",
            "role": "ADMIN",
        },
        {
            "email": "proveedor@turismosustentable.mx",
            "password": "ProveedorTS2026!",
            "full_name": "Cooperativa Xochimilco",
            "role": "PROVIDER",
            "business_name": "Chinampas Vivas SC",
            "rfc": "CVI260101ABC",
        },
        {
            "email": "turista@turismosustentable.mx",
            "password": "TuristaTS2026!",
            "full_name": "Uriel Miranda",
            "role": "TOURIST",
        },
    ]

    db = SessionLocal()
    try:
        for account in demo_accounts:
            existing = db.query(User).filter(User.email == account["email"]).first()
            if existing:
                continue

            try:
                user = User(
                    email=account["email"],
                    password_hash=hash_password(account["password"]),
                    full_name=account["full_name"],
                    role=account["role"],
                    preferred_language="es",
                )
                db.add(user)
                db.flush()

                if account["role"] == "PROVIDER":
                    db.add(
                        ProviderProfile(
                            user_id=user.id,
                            business_name=account["business_name"],
                            rfc=account["rfc"],
                        )
                    )
                elif account["role"] == "TOURIST":
                    db.add(TouristProfile(user_id=user.id))

                db.commit()
            except IntegrityError:
                db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas en PostgreSQL con reintentos y ejecutar seed inicial
    for attempt in range(1, 11):
        try:
            Base.metadata.create_all(bind=engine)
            _seed_demo_accounts()
            break
        except Exception as exc:
            logger.warning("Intento %s/10 al inicializar base de datos fallo: %s", attempt, exc)
            if attempt == 10:
                raise
            time.sleep(2)
    yield


# Inicializar aplicacion FastAPI
app = FastAPI(title="Auth & Users Microservice", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas de salud y dominio
app.include_router(health_router)
app.include_router(auth_router)