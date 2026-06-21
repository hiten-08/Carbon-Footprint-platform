"""
Auth routes: register and login.

Registration and login both return a bearer token so the frontend can
immediately transition into an authenticated state without a second
round trip. Error messages are deliberately generic on login ("incorrect
email or password") to avoid confirming whether an email is registered.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.orm import User
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut
from app.services.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(
        email=payload.email.lower(),
        display_name=payload.display_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    db.refresh(user)
    token = create_access_token(subject=user.id)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(subject=user.id)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/token", response_model=Token, include_in_schema=False)
def login_oauth2_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    OAuth2-compatible form login, kept so the auto-generated /docs 'Authorize'
    button works out of the box for anyone exploring the API (useful for
    judges poking at the FastAPI Swagger UI).
    """
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(subject=user.id)
    return Token(access_token=token, user=UserOut.model_validate(user))
