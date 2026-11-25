import re
from typing import Annotated, Literal, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

RFC_PATTERN = re.compile(r"^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$")


class UserRegisterRequest(BaseModel):
    # Validar datos de entrada para registro general
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str = Field(min_length=2, max_length=150)
    role: Literal["TOURIST", "PROVIDER"]
    preferred_language: Literal["es", "en"] = "es"
    # Campos opcionales segun rol
    business_name: Optional[str] = Field(default=None, max_length=200)
    rfc: Optional[str] = Field(default=None, max_length=13)

    @field_validator("rfc", mode="before")
    @classmethod
    def normalize_rfc(cls, value: object) -> Optional[str]:
        if value is None:
            return None
        if isinstance(value, str):
            cleaned = value.strip().upper()
            return cleaned or None
        return value

    @model_validator(mode="after")
    def validate_role_profile_fields(self) -> "UserRegisterRequest":
        self.full_name = self.full_name.strip()
        if len(self.full_name) < 2:
            raise ValueError("El nombre completo debe tener al menos 2 caracteres")

        if self.role == "TOURIST":
            # Ignorar RFC vacio o no aplicable para turistas
            if self.rfc == "":
                self.rfc = None
            return self

        clean_business_name = (self.business_name or "").strip()
        if not clean_business_name:
            raise ValueError("La razon social es obligatoria para proveedores")
        self.business_name = clean_business_name

        if not self.rfc or not RFC_PATTERN.fullmatch(self.rfc):
            raise ValueError("El RFC debe ser valido de 12 o 13 caracteres alfanumericos en mayusculas")

        return self


class UserLoginRequest(BaseModel):
    # Validar credenciales de acceso
    email: EmailStr
    password: str = Field(max_length=72)


class TouristPreferencesUpdate(BaseModel):
    # Validar actualizacion de intereses y accesibilidad
    travel_interests: list[Annotated[str, Field(min_length=1, max_length=80)]] = Field(max_length=20)
    accessibility_needs: list[Annotated[str, Field(min_length=1, max_length=80)]] = Field(max_length=20)


class TokenResponse(BaseModel):
    # Definir respuesta estandar tras autenticacion exitosa
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int