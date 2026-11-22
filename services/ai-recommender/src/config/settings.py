from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Definir variables de entorno requeridas para recomendaciones e IA
    service_name: str = "ai-recommender-service"
    environment: str = "development"
    llm_api_key: str = ""
    catalog_service_url: str = "http://catalog-service:8000"


# Instanciar configuracion global
settings = Settings()