"""
Application entrypoint.

Wires together the database, routers, and CORS. CORS origins are read
from an environment variable with a localhost default so the same image
works in local dev and in a deployed environment without a code change.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, entries, dashboard, activities

# Create tables on startup if they don't exist yet. For a hackathon-scale
# SQLite app this replaces a migration tool; a production deployment on
# Postgres would swap this for Alembic migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Carbon Footprint Awareness Platform API",
    description="Track, understand, and reduce your carbon footprint through simple logging and personalized insights.",
    version="1.0.0",
)

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(entries.router)
app.include_router(dashboard.router)
app.include_router(activities.router)


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}
