"""
Dashboard route.

Aggregation happens in Python over the user's recent entries rather than
pure SQL `GROUP BY` because the entry volume per user in this product is
inherently small (dozens to low hundreds of rows, not millions), so the
clarity of a straightforward Python reduction outweighs any DB-side
aggregation performance gain -- and it keeps the insight engine, which
needs row-level data anyway, working from the same in-memory list.
"""
import datetime as dt
from collections import defaultdict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.orm import User, Entry
from app.schemas.schemas import DashboardSummary, CategoryBreakdown, TrendPoint, InsightOut
from app.services.emission_factors import CATEGORY_LABELS, US_AVERAGE_DAILY_KG_CO2E
from app.services.insights import generate_insights

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cutoff = dt.datetime.utcnow() - dt.timedelta(days=days)
    entries = (
        db.query(Entry)
        .filter(Entry.user_id == current_user.id, Entry.logged_for_date >= cutoff)
        .order_by(Entry.logged_for_date.asc())
        .all()
    )

    total = sum(e.co2e_kg for e in entries)
    distinct_days = len({e.logged_for_date.date() for e in entries})

    # Category breakdown
    cat_totals = defaultdict(float)
    for e in entries:
        cat_totals[e.category] += e.co2e_kg
    breakdown = [
        CategoryBreakdown(
            category=cat,
            label=CATEGORY_LABELS[cat],
            total_kg_co2e=round(amount, 2),
            percent=round((amount / total * 100) if total else 0, 1),
        )
        for cat, amount in sorted(cat_totals.items(), key=lambda kv: kv[1], reverse=True)
    ]

    # Daily trend
    day_totals = defaultdict(float)
    for e in entries:
        day_totals[e.logged_for_date.date()] += e.co2e_kg
    trend = [
        TrendPoint(date=day, total_kg_co2e=round(amount, 2))
        for day, amount in sorted(day_totals.items())
    ]

    insights = [
        InsightOut(
            title=i.title,
            detail=i.detail,
            category=i.category,
            potential_savings_kg=i.potential_savings_kg,
        )
        for i in generate_insights(entries)
    ]

    return DashboardSummary(
        total_kg_co2e=round(total, 2),
        entry_count=len(entries),
        days_logged=distinct_days,
        daily_average_kg_co2e=round(total / distinct_days, 2) if distinct_days else 0,
        us_average_daily_kg_co2e=US_AVERAGE_DAILY_KG_CO2E,
        breakdown=breakdown,
        trend=trend,
        insights=insights,
    )
