from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
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
    normalized_email = data.email.strip().lower()

    # Verificar existencia previa del correo electronico
    if db.query(User).filter(User.email == normalized_email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya se encuentra registrado"
        )

    # Validar campos obligatorios y unicidad de RFC si el rol es proveedor
    clean_business_name = (data.business_name or "").strip()
    clean_rfc = (data.rfc or "").strip().upper()
    if data.role == "PROVIDER":
        if not clean_business_name or not clean_rfc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razon social y RFC son obligatorios para proveedores"
            )
        if db.query(ProviderProfile).filter(ProviderProfile.rfc == clean_rfc).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El RFC ya se encuentra registrado"
            )

    # Crear registro principal de usuario
    new_user = User(
        email=normalized_email,
        password_hash=hash_password(data.password),
        full_name=data.full_name.strip(),
        role=data.role,
        preferred_language=data.preferred_language
    )
    db.add(new_user)

    try:
        db.flush()

        # Crear perfil especializado segun rol asignado
        if data.role == "TOURIST":
            db.add(TouristProfile(user_id=new_user.id))
        elif data.role == "PROVIDER":
            db.add(ProviderProfile(
                user_id=new_user.id,
                business_name=clean_business_name,
                rfc=clean_rfc
            ))

        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo o RFC ya se encuentra registrado"
        )

    db.refresh(new_user)

    # Generar token de sesion inmediato
    token = create_access_token(new_user.id, new_user.role)
    return TokenResponse(access_token=token, role=new_user.role, user_id=new_user.id)


def authenticate_user(db: Session, credentials: UserLoginRequest) -> TokenResponse:
    normalized_email = credentials.email.strip().lower()

    # Buscar usuario por correo y verificar contrasena
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales invalidas"
        )

    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, role=user.role, user_id=user.id)


def get_current_user_profile(db: Session, user_id: int) -> dict:
    # Obtener perfil completo del usuario autenticado segun su rol
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    profile: dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "preferred_language": user.preferred_language,
        "travel_interests": [],
        "accessibility_needs": [],
        "business_name": None,
        "rfc": None,
    }

    if user.role == "TOURIST":
        tourist = db.query(TouristProfile).filter(TouristProfile.user_id == user.id).first()
        if tourist:
            profile["travel_interests"] = tourist.travel_interests or []
            profile["accessibility_needs"] = tourist.accessibility_needs or []
    elif user.role == "PROVIDER":
        provider = db.query(ProviderProfile).filter(ProviderProfile.user_id == user.id).first()
        if provider:
            profile["business_name"] = provider.business_name
            profile["rfc"] = provider.rfc
            profile["validation_status"] = provider.validation_status

    return profile


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