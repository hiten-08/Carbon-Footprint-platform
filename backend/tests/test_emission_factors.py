import pytest

from app.services.emission_factors import (
    ACTIVITY_FACTORS,
    CATEGORY_LABELS,
    get_factor,
    list_factors_by_category,
)


def test_every_factor_has_a_valid_category():
    for factor in ACTIVITY_FACTORS.values():
        assert factor.category in CATEGORY_LABELS


def test_every_factor_key_matches_its_dict_key():
    for key, factor in ACTIVITY_FACTORS.items():
        assert key == factor.key


def test_get_factor_returns_known_activity():
    factor = get_factor("car_gasoline")
    assert factor.unit == "mile"
    assert factor.kg_co2e_per_unit > 0


def test_get_factor_raises_on_unknown_activity():
    with pytest.raises(KeyError):
        get_factor("not_a_real_activity")


def test_list_factors_by_category_covers_all_categories():
    grouped = list_factors_by_category()
    assert set(grouped.keys()) == set(CATEGORY_LABELS.keys())
    for activities in grouped.values():
        assert len(activities) > 0


def test_red_meat_has_higher_footprint_than_vegan_meal():
    beef = get_factor("meal_beef")
    vegan = get_factor("meal_vegan")
    assert beef.kg_co2e_per_unit > vegan.kg_co2e_per_unit


def test_recycling_factor_is_negative_offset():
    recycled = get_factor("waste_recycled")
    assert recycled.kg_co2e_per_unit < 0
