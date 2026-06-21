"""
Pydantic schemas.

Validation lives here, at the boundary, so handlers can trust their input
shapes. Quantity is bounded to a sane positive range to reject obvious
garbage (negative driving distance, etc.) without being so strict that
real-world entries get rejected.
"""
import datetime as dt
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.services.emission_factors import ACTIVITY_FACTORS


# ---------- Auth ----------

class UserCreate(BaseModel):
    email: EmailStr
    display_name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Entries ----------

class EntryCreate(BaseModel):
    activity: str
    quantity: float = Field(gt=0, le=1_000_000)
    note: Optional[str] = Field(default=None, max_length=280)
    logged_for_date: dt.date

    @field_validator("activity")
    @classmethod
    def activity_must_be_known(cls, v: str) -> str:
        if v not in ACTIVITY_FACTORS:
            raise ValueError(f"Unknown activity '{v}'")
        return v


class EntryOut(BaseModel):
    id: str
    category: str
    activity: str
    activity_label: str
    quantity: float
    unit: str
    co2e_kg: float
    note: Optional[str]
    logged_for_date: dt.date
    created_at: dt.datetime

    class Config:
        from_attributes = True


# ---------- Dashboard / insights ----------

class CategoryBreakdown(BaseModel):
    category: str
    label: str
    total_kg_co2e: float
    percent: float


class TrendPoint(BaseModel):
    date: dt.date
    total_kg_co2e: float


class InsightOut(BaseModel):
    title: str
    detail: str
    category: str
    potential_savings_kg: Optional[float]


class DashboardSummary(BaseModel):
    total_kg_co2e: float
    entry_count: int
    days_logged: int
    daily_average_kg_co2e: float
    us_average_daily_kg_co2e: float
    breakdown: List[CategoryBreakdown]
    trend: List[TrendPoint]
    insights: List[InsightOut]


class ActivityFactorOut(BaseModel):
    key: str
    label: str
    category: str
    unit: str
    kg_co2e_per_unit: float
    icon: str
    notes: str
