import redis
from src.config.settings import settings

# Inicializar cliente Redis para bloqueo temporal de cupos ecologicos
redis_client = redis.from_url(settings.redis_url, decode_responses=True)