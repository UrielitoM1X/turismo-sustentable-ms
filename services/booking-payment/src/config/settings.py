from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Definir variables de entorno requeridas para reservas y pagos
    service_name: str = "booking-payment-service"
    environment: str = "development"
    db_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    redis_url: str
    rabbitmq_url: str
    stripe_api_key: str = ""
    stripe_webhook_secret: str = ""
    frontend_url: str = "http://localhost"
    catalog_service_url: str = "http://catalog-service:8000"


# Instanciar configuracion global
settings = Settings()
