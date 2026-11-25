from typing import Optional
from fastapi import Header, HTTPException, status
import jwt
from src.config.settings import settings


def verify_jwt_token(authorization: Optional[str] = Header(default=None)) -> dict:
    # Extraer y decodificar token JWT emitido por auth-users-service
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autorizacion requerido o formato invalido"
        )
    parts = authorization.split(" ", 1)
    token = parts[1].strip() if len(parts) == 2 else ""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autorizacion vacio"
        )
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "sub"]}
        )
        sub = payload.get("sub")
        if isinstance(sub, bool):
            raise ValueError("sub invalido")
        int(sub)
        return payload
    except (jwt.PyJWTError, TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado o invalido")