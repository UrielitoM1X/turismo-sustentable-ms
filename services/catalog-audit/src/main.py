from fastapi import FastAPI
from src.config.database import Base, engine
from src.routes.health_routes import router as health_router
from src.routes.audit_routes import router as audit_router
from src.routes.experience_routes import router as experience_router

# Crear tablas geoespaciales y de auditoria en PostgreSQL
Base.metadata.create_all(bind=engine)

# Inicializar aplicacion FastAPI
app = FastAPI(title="Catalog & Sustainability Audit Microservice")

# Registrar enrutadores del dominio
app.include_router(health_router)
app.include_router(audit_router)
app.include_router(experience_router)

# Revisar pq vrg no arranca este servicio ;-;