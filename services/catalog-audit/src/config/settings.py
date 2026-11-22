from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Definir variables de entorno requeridas para catalogo y auditorias
    service_name: str = "catalog-audit-service"
    environment: str = "development"
    db_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    s3_bucket_name: str = "ts-evidences"


# Instanciar configuracion global
settings = Settings()