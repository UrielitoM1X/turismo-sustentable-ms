from fastapi import FastAPI
from src.config.database import Base, engine
from src.routes.health_routes import router as health_router
from src.routes.auth_routes import router as auth_router

# Crear tablas automaticamente en PostgreSQL al iniciar
Base.metadata.create_all(bind=engine)

# Inicializar aplicacion FastAPI
app = FastAPI(title="Auth & Users Microservice")

# Registrar rutas de salud y dominio
app.include_router(health_router)
app.include_router(auth_router)