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
    config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    region_name="us-east-1"
)


def ensure_bucket_exists() -> None:
    # Crear bucket de evidencias solo si no existe (404 / NoSuchBucket)
    try:
        s3_client.head_bucket(Bucket=settings.s3_bucket_name)
    except ClientError as exc:
        error_code = str(exc.response.get("Error", {}).get("Code", ""))
        status_code = exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
        if error_code in {"404", "NoSuchBucket", "NotFound"} or status_code == 404:
            try:
                s3_client.create_bucket(Bucket=settings.s3_bucket_name)
            except ClientError as create_exc:
                create_code = str(create_exc.response.get("Error", {}).get("Code", ""))
                if create_code not in {"BucketAlreadyOwnedByYou", "BucketAlreadyExists"}:
                    raise
        else:
            raise