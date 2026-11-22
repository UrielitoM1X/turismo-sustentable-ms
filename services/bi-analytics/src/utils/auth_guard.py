from fastapi import Header, HTTPException, status
import jwt
from src.config.settings import settings


def verify_jwt_token(authorization: str = Header(...)) -> dict:
    # Extraer y decodificar token JWT emitido por auth-users-service
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Formato de token invalido")
    token = authorization.split(" ")[1]
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado o invalido")