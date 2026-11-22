from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional


class UserRegisterRequest(BaseModel):
    # Validar datos de entrada para registro general
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2, max_length=150)
    role: Literal["TOURIST", "PROVIDER", "ADMIN"]
    preferred_language: Literal["es", "en"] = "es"
    # Campos opcionales segun rol
    business_name: Optional[str] = None
    rfc: Optional[str] = Field(default=None, min_length=12, max_length=13)


class UserLoginRequest(BaseModel):
    # Validar credenciales de acceso
    email: EmailStr
    password: str


class TouristPreferencesUpdate(BaseModel):
    # Validar actualizacion de intereses y accesibilidad
    travel_interests: list[str]
    accessibility_needs: list[str]


class TokenResponse(BaseModel):
    # Definir respuesta estandar tras autenticacion exitosa
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int