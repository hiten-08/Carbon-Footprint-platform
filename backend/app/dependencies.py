"""
Shared FastAPI dependencies.

`get_current_user` enforces auth on any route that depends on it: it
decodes the bearer token, looks up the user, and raises 401 on any
failure (missing token, invalid signature, expired token, deleted user)
without leaking which specific failure occurred -- that distinction isn't
useful to a client and narrowing it down is more useful to an attacker
than to a legitimate user.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.orm import User
from app.services.auth import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_error
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_error
    return user
