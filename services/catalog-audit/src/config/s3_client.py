import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from src.config.settings import settings

# Inicializar cliente compatible con S3 apuntando al contenedor RustFS/MinIO
s3_client = boto3.client(
    "s3",
    endpoint_url=f"http://{settings.minio_endpoint}",
    aws_access_key_id=settings.minio_access_key,
    aws_secret_access_key=settings.minio_secret_key,
    config=Config(signature_version="s3v4"),
    region_name="us-east-1"
)


def ensure_bucket_exists() -> None:
    # Crear bucket de evidencias si aun no existe en el almacenamiento
    try:
        s3_client.head_bucket(Bucket=settings.s3_bucket_name)
    except ClientError:
        s3_client.create_bucket(Bucket=settings.s3_bucket_name)