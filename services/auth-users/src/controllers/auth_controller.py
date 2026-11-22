from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.models.user_model import User, TouristProfile, ProviderProfile
from src.schemas.user_schema import (
    UserRegisterRequest,
    UserLoginRequest,
    TouristPreferencesUpdate,
    TokenResponse
)
from src.utils.security import hash_password, verify_password, create_access_token


def register_user(db: Session, data: UserRegisterRequest) -> TokenResponse:
    # Verificar existencia previa del correo electronico
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya se encuentra registrado"
        )

    # Validar campos obligatorios si el rol es proveedor
    if data.role == "PROVIDER" and (not data.business_name or not data.rfc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razon social y RFC son obligatorios para proveedores"
        )

    # Crear registro principal de usuario
    new_user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=data.role,
        preferred_language=data.preferred_language
    )
    db.add(new_user)
    db.flush()

    # Crear perfil especializado segun rol asignado
    if data.role == "TOURIST":
        db.add(TouristProfile(user_id=new_user.id))
    elif data.role == "PROVIDER":
        db.add(ProviderProfile(
            user_id=new_user.id,
            business_name=data.business_name,
            rfc=data.rfc.upper()
        ))

    db.commit()
    db.refresh(new_user)

    # Generar token de sesion inmediato
    token = create_access_token(new_user.id, new_user.role)
    return TokenResponse(access_token=token, role=new_user.role, user_id=new_user.id)


def authenticate_user(db: Session, credentials: UserLoginRequest) -> TokenResponse:
    # Buscar usuario por correo y verificar contrasena
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas"
        )

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, role=user.role, user_id=user.id)


def update_tourist_preferences(db: Session, user_id: int, prefs: TouristPreferencesUpdate) -> dict:
    # Actualizar intereses y necesidades de accesibilidad del turista
    profile = db.query(TouristProfile).filter(TouristProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de turista no encontrado"
        )

    profile.travel_interests = prefs.travel_interests
    profile.accessibility_needs = prefs.accessibility_needs
    db.commit()
    return {"message": "Preferencias actualizadas correctamente"}