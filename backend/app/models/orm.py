"""
ORM models.

Two tables: `users` for auth, `entries` for individual carbon-emitting
activities a user logs (one row per logged action, e.g. "12 miles driven").
Keeping entries atomic (rather than pre-aggregated) lets the insights
engine recompute breakdowns and trends from raw data at any granularity.
"""
import uuid
import datetime as dt

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    entries = relationship("Entry", back_populates="owner", cascade="all, delete-orphan")


class Entry(Base):
    """
    A single logged activity.

    `category` is one of: transport, energy, food, waste (validated at the
    schema layer). `activity` identifies the specific emission-factor key
    within that category (e.g. "car_gasoline", "electricity_grid",
    "beef_meal"). `quantity` is the user-entered amount in the activity's
    natural unit (miles, kWh, meals, kg) and `co2e_kg` is the computed
    result, stored at write time so historical entries remain stable even
    if emission factors are later refined.
    """
    __tablename__ = "entries"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    category = Column(String, nullable=False)
    activity = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    co2e_kg = Column(Float, nullable=False)

    note = Column(String, nullable=True)
    logged_for_date = Column(DateTime, nullable=False)  # the day the activity happened
    created_at = Column(DateTime, default=dt.datetime.utcnow)  # when the row was written

    owner = relationship("User", back_populates="entries")


# Composite index: the dashboard's most common query is "this user's
# entries within a date range," so index user_id + logged_for_date together
# rather than relying on two separate single-column indexes.
Index("ix_entries_user_date", Entry.user_id, Entry.logged_for_date)
