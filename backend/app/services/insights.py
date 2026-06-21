"""
Personalized insights engine.

Rule-based (not ML) by design: for a hackathon-scale dataset, a transparent
rule set is more reliable, explainable, and testable than a model trained
on too little data, and judges can audit exactly why a tip was shown.

The engine looks at a user's recent entries, finds their highest-impact
category and activity, and returns 1-3 specific, low-friction suggestions
-- never a generic lecture. Each tip names a concrete swap and, where
possible, estimates the kg CO2e saved per occurrence so the suggestion is
quantified rather than vague.
"""
from collections import defaultdict
from dataclasses import dataclass
from typing import List

from app.models.orm import Entry
from app.services.emission_factors import get_factor, CATEGORY_LABELS


@dataclass
class Insight:
    title: str
    detail: str
    category: str
    potential_savings_kg: float | None  # estimated kg CO2e/occurrence if acted on


# Swap rules: (from_activity, to_activity, headline template)
_SWAP_RULES = [
    ("car_gasoline", "bike_walk", "Swap a short drive for biking or walking"),
    ("car_gasoline", "bus", "Try the bus for a few of your regular drives"),
    ("car_gasoline", "rail", "Take the train when it's an option"),
    ("meal_beef", "meal_chicken_fish", "Swap one beef meal a week for chicken or fish"),
    ("meal_beef", "meal_vegetarian", "Try a vegetarian meal in place of red meat"),
    ("flight_short", "rail", "Consider rail for short trips instead of flying"),
    ("waste_landfill", "waste_recycled", "Sort out recyclables before the trash"),
    ("waste_landfill", "waste_composted", "Compost food scraps instead of binning them"),
]


def _category_totals(entries: List[Entry]) -> dict:
    totals = defaultdict(float)
    for e in entries:
        totals[e.category] += e.co2e_kg
    return totals


def _activity_totals(entries: List[Entry]) -> dict:
    totals = defaultdict(float)
    counts = defaultdict(int)
    for e in entries:
        totals[e.activity] += e.co2e_kg
        counts[e.activity] += 1
    return totals, counts


def generate_insights(entries: List[Entry], max_insights: int = 3) -> List[Insight]:
    if not entries:
        return [
            Insight(
                title="Log your first activity to get started",
                detail="Add a few entries from your week -- a commute, a meal, your "
                       "electricity bill -- and we'll surface where your footprint "
                       "is concentrated and what to try first.",
                category="general",
                potential_savings_kg=None,
            )
        ]

    cat_totals = _category_totals(entries)
    act_totals, act_counts = _activity_totals(entries)

    insights: List[Insight] = []

    # 1. Highest-impact category callout
    top_category = max(cat_totals, key=cat_totals.get)
    total_all = sum(cat_totals.values()) or 1.0
    share = cat_totals[top_category] / total_all * 100
    insights.append(
        Insight(
            title=f"{CATEGORY_LABELS[top_category]} is your biggest source",
            detail=(
                f"{CATEGORY_LABELS[top_category]} makes up about {share:.0f}% of your "
                f"logged emissions ({cat_totals[top_category]:.1f} kg CO2e). "
                f"That's the highest-leverage place to focus first."
            ),
            category=top_category,
            potential_savings_kg=None,
        )
    )

    # 2. Specific swap suggestions based on highest-emitting activities logged
    top_activities = sorted(act_totals, key=act_totals.get, reverse=True)
    suggested_categories = set()
    for activity_key in top_activities:
        if len(insights) >= max_insights:
            break
        for from_key, to_key, headline in _SWAP_RULES:
            if activity_key != from_key:
                continue
            from_factor = get_factor(from_key)
            to_factor = get_factor(to_key)
            if from_factor.category in suggested_categories:
                continue
            per_unit_savings = max(from_factor.kg_co2e_per_unit - to_factor.kg_co2e_per_unit, 0)
            avg_quantity = (
                act_totals[from_key] / act_counts[from_key] / from_factor.kg_co2e_per_unit
                if from_factor.kg_co2e_per_unit > 0 and act_counts[from_key] > 0
                else 1
            )
            savings = round(per_unit_savings * avg_quantity, 2) if per_unit_savings else None
            insights.append(
                Insight(
                    title=headline,
                    detail=(
                        f"You've logged {act_counts[from_key]} "
                        f"{'entry' if act_counts[from_key] == 1 else 'entries'} of "
                        f"\"{from_factor.label}\". Switching saves roughly "
                        f"{savings:.1f} kg CO2e per occurrence."
                        if savings
                        else f"You've logged {from_factor.label} -- this swap reduces that activity's impact."
                    ),
                    category=from_factor.category,
                    potential_savings_kg=savings,
                )
            )
            suggested_categories.add(from_factor.category)
            break  # one suggestion per top activity

    # 3. Fallback encouragement if not enough swap rules matched
    if len(insights) < 2:
        insights.append(
            Insight(
                title="Keep logging to unlock sharper insights",
                detail="A few more days of entries will help us spot patterns and "
                       "give you more specific, personalized suggestions.",
                category="general",
                potential_savings_kg=None,
            )
        )

    return insights[:max_insights]
