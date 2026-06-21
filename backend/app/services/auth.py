"""
Auth utilities.

Passwords are hashed with bcrypt (via passlib) -- never stored or logged
in plaintext. Sessions use short-lived JWTs signed with a server-side
secret read from the environment, never hardcoded, so the same code is
safe to opensource without leaking a credential.
"""
import os
import datetime as dt
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext

# Read from environment; fall back to a random per-process secret so the
# app still runs out of the box for a demo, but production deployments
# should always set JWT_SECRET_KEY explicitly.
SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.urandom(32).hex()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days, reasonable for a demo app

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str) -> str:
    expire = dt.datetime.utcnow() + dt.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
