from fastapi import FastAPI
from src.config.database import Base, engine
from src.routes.health_routes import router as health_router
from src.routes.booking_routes import router as booking_router
from src.routes.itinerary_routes import router as itinerary_router

# Crear tablas de reservas, pagos, favoritos e itinerarios en PostgreSQL
Base.metadata.create_all(bind=engine)

# Inicializar aplicacion FastAPI
app = FastAPI(title="Booking & Payment Microservice")

# Registrar enrutadores del dominio
app.include_router(health_router)
app.include_router(booking_router)
app.include_router(itinerary_router)