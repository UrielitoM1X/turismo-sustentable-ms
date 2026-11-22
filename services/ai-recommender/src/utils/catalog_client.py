import httpx
from src.config.settings import settings


async def fetch_active_experiences() -> list[dict]:
    # Consultar catalogo de experiencias aprobadas desde catalog-service
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.catalog_service_url}/experiences/")
            if response.status_code == 200:
                return response.json()
            return []
    except httpx.RequestError:
        return []