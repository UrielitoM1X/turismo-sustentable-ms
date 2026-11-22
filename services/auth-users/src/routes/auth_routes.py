from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
import jwt
from src.config.database import get_db
from src.schemas.user_schema import (
    UserRegisterRequest,
    UserLoginRequest,
    TouristPreferencesUpdate,
    TokenResponse
)
from src.controllers.auth_controller import (
    register_user,
    authenticate_user,
    update_tourist_preferences
)
from src.utils.security import decode_access_token

router = APIRouter(prefix="/users", tags=["Authentication & Profiles"])


def get_current_user_payload(authorization: str = Header(...)) -> dict:
    # Extraer y validar token Bearer desde encabezado Authorization
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Formato de token invalido")
    token = authorization.split(" ")[1]
    try:
        return decode_access_token(token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado o invalido")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegisterRequest, db: Session = Depends(get_db)):
    # Registrar nueva cuenta de turista, proveedor o administrador
    return register_user(db, data)


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLoginRequest, db: Session = Depends(get_db)):
    # Iniciar sesion y obtener token JWT
    return authenticate_user(db, credentials)


@router.put("/preferences")
def update_preferences(
    prefs: TouristPreferencesUpdate,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    # Actualizar preferencias de viaje del turista autenticado
    if payload.get("role") != "TOURIST":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso exclusivo para turistas")
    return update_tourist_preferences(db, int(payload["sub"]), prefs)