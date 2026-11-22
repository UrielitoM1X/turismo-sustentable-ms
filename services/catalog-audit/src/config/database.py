from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from src.config.settings import settings

# Crear motor de conexion a PostgreSQL con soporte PostGIS
engine = create_engine(settings.db_url, pool_pre_ping=True)

# Configurar fabrica de sesiones
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Definir clase base para modelos ORM
Base = declarative_base()


def get_db():
    # Proveer sesion de base de datos por peticion y cerrarla al finalizar
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()