"""
Database configuration.

Uses SQLite for zero-setup local persistence. A single `engine` and
`SessionLocal` factory are shared across the app; `get_db` is a FastAPI
dependency that yields a request-scoped session and guarantees cleanup.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./carbon_app.db")

# check_same_thread=False is required for SQLite when used with FastAPI's
# threaded request handling; SQLAlchemy's session-per-request pattern
# keeps this safe.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
