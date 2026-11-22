from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Definir variables de entorno requeridas
    service_name: str = "auth-users-service"
    environment: str = "development"
    db_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440


# Instanciar configuracion global
settings = Settings()