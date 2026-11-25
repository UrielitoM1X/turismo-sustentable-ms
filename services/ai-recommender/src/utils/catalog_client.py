import httpx
from fastapi import HTTPException
from src.config.settings import settings


async def fetch_active_experiences() -> list[dict]:
    # Consultar catalogo de experiencias aprobadas desde catalog-service
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.catalog_service_url}/experiences/")
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, list):
                raise ValueError("Respuesta inesperada del catalogo de experiencias")
            return data
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as exc:
        raise HTTPException(
            status_code=503,
            detail="El catalogo de experiencias no esta disponible temporalmente"
        ) from exc