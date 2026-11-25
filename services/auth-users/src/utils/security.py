from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
import jwt
from passlib.context import CryptContext
from src.config.settings import settings

# Configurar algoritmo bcrypt para encriptacion de contrasenas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    # Generar hash seguro a partir de contrasena plana
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Comparar contrasena plana contra hash almacenado
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int, role: str) -> str:
    # Construir payload y firmar token JWT con expiracion
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiration_minutes)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    # Decodificar y validar firma, expiracion y subject numerico del token JWT
    payload = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["exp", "sub"]}
    )
    try:
        int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado o invalido"
        )
    return payload