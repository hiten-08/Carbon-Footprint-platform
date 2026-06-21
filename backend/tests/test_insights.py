import datetime as dt

from app.models.orm import Entry
from app.services.insights import generate_insights


def _entry(activity, category, co2e, n=1, date=None):
    return Entry(
        id=f"e-{activity}-{n}",
        user_id="u1",
        category=category,
        activity=activity,
        quantity=1,
        unit="unit",
        co2e_kg=co2e,
        logged_for_date=date or dt.datetime(2026, 6, 1),
    )


def test_no_entries_returns_onboarding_tip():
    insights = generate_insights([])
    assert len(insights) == 1
    assert "first activity" in insights[0].title.lower()


def test_identifies_highest_impact_category():
    entries = [
        _entry("car_gasoline", "transport", 20.0),
        _entry("electricity", "energy", 2.0),
    ]
    insights = generate_insights(entries)
    assert insights[0].category == "transport"
    assert "transport" in insights[0].title.lower()


def test_suggests_swap_for_top_emitting_activity():
    entries = [_entry("car_gasoline", "transport", 40.0, n=i) for i in range(5)]
    insights = generate_insights(entries)
    titles = " ".join(i.title.lower() for i in insights)
    assert "bik" in titles or "bus" in titles or "train" in titles


def test_beef_meal_triggers_meat_swap_suggestion():
    entries = [_entry("meal_beef", "food", 6.6, n=i) for i in range(3)]
    insights = generate_insights(entries)
    titles = " ".join(i.title.lower() for i in insights)
    assert "beef" in titles or "vegetarian" in titles or "chicken" in titles


def test_insights_capped_at_max():
    entries = (
        [_entry("car_gasoline", "transport", 10.0, n=i) for i in range(2)]
        + [_entry("meal_beef", "food", 6.6, n=i) for i in range(2)]
        + [_entry("waste_landfill", "waste", 1.0, n=i) for i in range(2)]
    )
    insights = generate_insights(entries, max_insights=2)
    assert len(insights) == 2
