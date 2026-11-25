from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Definir variables de entorno requeridas para analitica y panel BI
    service_name: str = "bi-analytics-service"
    environment: str = "development"
    db_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    rabbitmq_url: str
    catalog_service_url: str = "http://catalog-service:8000"
    auth_service_url: str = "http://auth-service:8000"
    booking_service_url: str = "http://booking-service:8000"
    social_service_url: str = "http://social-service:3000"
    ai_service_url: str = "http://ai-service:8000"


# Instanciar configuracion global
settings = Settings()