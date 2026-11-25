from src.config.settings import settings


def get_service_status() -> dict:
    # Retornar estado operativo del microservicio
    return {
        "status": "online",
        "service": settings.service_name,
        "environment": settings.environment
    }