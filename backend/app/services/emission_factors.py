"""
Emission factor reference data.

Every factor here is sourced from a publicly documented, citable source
(primarily EPA) rather than guessed, so results are defensible. Factors are
expressed as kg CO2e per one unit of the activity's natural unit.

Sources (accessed June 2026):
  - EPA "Greenhouse Gas Emissions from a Typical Passenger Vehicle":
    ~0.40 kg CO2e per mile for an average gasoline passenger vehicle.
    https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle
  - EPA Greenhouse Gas Equivalencies Calculator (eGRID 2024 data):
    grid electricity factor of ~823 lb CO2e/MWh -> ~0.37 kg/kWh; we use a
    rounded US national average of 0.40 kg/kWh to stay conservative across
    regions, since regional grids vary roughly 2x in either direction.
    https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references
  - EPA Emission Factors for Greenhouse Gas Inventories (transport modes:
    bus, rail, air travel, motorcycle) and natural gas combustion factors.
  - Diet-category footprints (food) draw on widely cited lifecycle-assessment
    figures (e.g. Poore & Nemecek, 2018, Science) showing red meat as the
    highest-impact food category by a wide margin, used here as an
    illustrative per-meal multiplier rather than a precise LCA computation.
  - Waste factors draw on EPA WARM model order-of-magnitude figures for
    landfilled municipal solid waste vs. recycling/composting offsets.

These are deliberately presented to users as estimates (see `notes` field)
since exact emissions depend on vehicle efficiency, regional grid mix, and
specific products -- the goal is directionally accurate awareness, not a
certified audit.
"""
from dataclasses import dataclass
from typing import Dict


@dataclass(frozen=True)
class ActivityFactor:
    key: str
    label: str
    category: str
    unit: str               # natural unit the user enters quantity in
    kg_co2e_per_unit: float
    icon: str                # lucide-react icon name for the frontend
    notes: str = ""


ACTIVITY_FACTORS: Dict[str, ActivityFactor] = {
    # ---- Transport ----
    "car_gasoline": ActivityFactor(
        "car_gasoline", "Gasoline car (miles driven)", "transport", "mile",
        0.40, "Car",
        "EPA average: ~400g CO2 per mile for a typical gasoline passenger vehicle.",
    ),
    "car_electric": ActivityFactor(
        "car_electric", "Electric car (miles driven)", "transport", "mile",
        0.13, "Car",
        "Based on average US grid electricity intensity and typical EV efficiency (~0.3 kWh/mile).",
    ),
    "bus": ActivityFactor(
        "bus", "Bus (miles traveled)", "transport", "mile",
        0.14, "Bus",
        "Per-passenger-mile average for transit bus, EPA emission factors.",
    ),
    "rail": ActivityFactor(
        "rail", "Train / subway (miles traveled)", "transport", "mile",
        0.13, "TrainFront",
        "Per-passenger-mile average for intercity and transit rail.",
    ),
    "flight_short": ActivityFactor(
        "flight_short", "Flight, short-haul (miles traveled)", "transport", "mile",
        0.21, "Plane",
        "Flights under ~300 miles one-way; higher per-mile factor due to takeoff/landing emissions.",
    ),
    "flight_long": ActivityFactor(
        "flight_long", "Flight, long-haul (miles traveled)", "transport", "mile",
        0.16, "Plane",
        "Flights over ~2,300 miles one-way.",
    ),
    "bike_walk": ActivityFactor(
        "bike_walk", "Biked or walked instead of driving (miles)", "transport", "mile",
        0.0, "Bike",
        "Logged as a zero-emission choice -- tracked to show avoided emissions.",
    ),

    # ---- Home Energy ----
    "electricity": ActivityFactor(
        "electricity", "Electricity used (kWh)", "energy", "kWh",
        0.40, "Zap",
        "US national average grid intensity (EPA eGRID); actual value varies by region.",
    ),
    "natural_gas": ActivityFactor(
        "natural_gas", "Natural gas used (therms)", "energy", "therm",
        5.3, "Flame",
        "EPA combustion factor for natural gas, ~5.3 kg CO2e per therm.",
    ),
    "renewable_energy": ActivityFactor(
        "renewable_energy", "Renewable electricity used (kWh)", "energy", "kWh",
        0.02, "Sun",
        "Near-zero direct emissions; small factor accounts for lifecycle manufacturing impact.",
    ),

    # ---- Food ----
    "meal_beef": ActivityFactor(
        "meal_beef", "Meal with beef/red meat", "food", "meal",
        6.6, "Beef",
        "Red meat has the highest footprint of any common food category, largely from methane.",
    ),
    "meal_chicken_fish": ActivityFactor(
        "meal_chicken_fish", "Meal with chicken or fish", "food", "meal",
        1.6, "Fish",
        "Poultry and fish have a meaningfully lower footprint than red meat.",
    ),
    "meal_vegetarian": ActivityFactor(
        "meal_vegetarian", "Vegetarian meal", "food", "meal",
        0.9, "Salad",
        "Plant-based meals (with dairy/eggs) average well below meat-based meals.",
    ),
    "meal_vegan": ActivityFactor(
        "meal_vegan", "Vegan meal", "food", "meal",
        0.5, "Sprout",
        "Fully plant-based meals carry the lowest average food footprint.",
    ),
    "food_waste": ActivityFactor(
        "food_waste", "Food thrown away (kg)", "food", "kg",
        2.5, "Trash2",
        "Wasted food carries the emissions of producing it, with no nutritional benefit gained.",
    ),

    # ---- Waste ----
    "waste_landfill": ActivityFactor(
        "waste_landfill", "General trash sent to landfill (kg)", "waste", "kg",
        0.58, "Trash",
        "EPA WARM model: methane from landfilled mixed municipal solid waste.",
    ),
    "waste_recycled": ActivityFactor(
        "waste_recycled", "Material recycled instead of landfilled (kg)", "waste", "kg",
        -0.35, "Recycle",
        "Negative value reflects avoided emissions vs. landfilling the same material.",
    ),
    "waste_composted": ActivityFactor(
        "waste_composted", "Organic waste composted instead of landfilled (kg)", "waste", "kg",
        -0.18, "Sprout",
        "Composting avoids the methane generated when organics decompose in a landfill.",
    ),
}

CATEGORY_LABELS = {
    "transport": "Transport",
    "energy": "Home Energy",
    "food": "Food",
    "waste": "Waste",
}

# A rough US daily-average baseline (kg CO2e/day) used purely to give the
# dashboard a relatable comparison point, derived from EPA's ~16 tonnes/yr
# per-capita US figure referenced in public EPA materials.
US_AVERAGE_DAILY_KG_CO2E = 43.8


def get_factor(activity_key: str) -> ActivityFactor:
    if activity_key not in ACTIVITY_FACTORS:
        raise KeyError(f"Unknown activity key: {activity_key}")
    return ACTIVITY_FACTORS[activity_key]


def list_factors_by_category() -> Dict[str, list]:
    grouped: Dict[str, list] = {c: [] for c in CATEGORY_LABELS}
    for factor in ACTIVITY_FACTORS.values():
        grouped[factor.category].append(factor)
    return grouped
