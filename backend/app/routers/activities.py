"""
Activities catalog route.

Public (no auth needed) -- this is reference data, not user data. Exposing
it lets the frontend render the log form, units, and icons dynamically
instead of duplicating the factor table in two places, which would risk
the two falling out of sync.
"""
from fastapi import APIRouter

from app.schemas.schemas import ActivityFactorOut
from app.services.emission_factors import ACTIVITY_FACTORS

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.get("", response_model=list[ActivityFactorOut])
def list_activities():
    return [
        ActivityFactorOut(
            key=f.key,
            label=f.label,
            category=f.category,
            unit=f.unit,
            kg_co2e_per_unit=f.kg_co2e_per_unit,
            icon=f.icon,
            notes=f.notes,
        )
        for f in ACTIVITY_FACTORS.values()
    ]
