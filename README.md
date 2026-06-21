# Footing — Carbon Footprint Awareness Platform

Built for the **[Challenge 3] Carbon Footprint Awareness Platform** brief:
> Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

A full-stack app where people log everyday activities (commutes, meals, energy use, waste) and get back a clear breakdown of their footprint, a trend over time, and specific, quantified swaps to reduce it — not generic lectures.

## Stack

- **Backend:** FastAPI + SQLAlchemy + SQLite, JWT auth, pytest test suite
- **Frontend:** React (Vite) + React Router + Recharts + lucide-react

## Why these choices

- **SQLite** — zero setup, file-based, fully demoable by cloning and running; swappable for Postgres via one env var (`DATABASE_URL`) with no code changes, since the data layer goes through SQLAlchemy.
- **Rule-based insights engine** (not ML) — with the data volume a single user generates, a transparent rule set is more reliable and auditable than a model trained on too little data. Every suggestion is traceable to a specific rule.
- **Real emission factors** — sourced from EPA (vehicle, electricity grid, natural gas) and widely cited food lifecycle figures, documented inline in `backend/app/services/emission_factors.py`, so the numbers are defensible rather than invented.

## Project structure

```
backend/
  app/
    main.py              # FastAPI app, CORS, router wiring
    database.py           # SQLAlchemy engine/session
    dependencies.py       # get_current_user auth dependency
    models/orm.py          # User, Entry tables
    schemas/schemas.py     # Pydantic request/response models
    routers/                # auth, entries, dashboard, activities
    services/
      emission_factors.py  # sourced CO2e factors per activity
      insights.py           # rule-based personalized insights engine
      auth.py                # password hashing + JWT
  tests/                    # pytest suite (auth, entries, dashboard, insights, factors)
  requirements.txt
  .env.example

frontend/
  src/
    api/client.js           # fetch wrapper, token handling, 401 → logout
    auth/                    # AuthContext, RequireAuth route guard
    components/              # AppShell, FootprintGauge (signature visual), ActivityIcon
    pages/                    # Dashboard, LogActivity, History, Login/Register
    styles/tokens.css         # design tokens (color, type)
  package.json
```

## Running it locally

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # optional, sane defaults work without it
uvicorn app.main:app --reload --port 8000
```

API docs (Swagger UI) at `http://localhost:8000/docs`.

Run the test suite:

```bash
pytest -v
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` to `http://localhost:8000`, so both must be running.

Run frontend tests:

```bash
npm run test
```

## How it addresses each evaluation parameter

- **Problem Statement Alignment** — direct loop of understand (dashboard breakdown + trend) → track (simple categorized logging) → reduce (quantified, personalized swap suggestions).
- **Code Quality** — layered backend (routers / services / schemas / models), typed Pydantic validation at the boundary, no duplicated emission-factor data between frontend and backend (frontend fetches the catalog from `/api/activities`).
- **Security** — bcrypt password hashing, JWT-signed sessions, every entry query scoped to `current_user.id` (verified by ownership-isolation tests), generic auth error messages that don't leak whether an email is registered.
- **Efficiency** — SQLite composite index on `(user_id, logged_for_date)` for the dashboard's primary query pattern; aggregation done once per request over an already-scoped, time-bounded entry set.
- **Testing** — 30+ backend tests (auth, ownership isolation, calculation correctness, insights logic, data integrity) and frontend unit tests (gauge component, API client error handling).
- **Accessibility** — color tokens checked against WCAG AA contrast (4.5:1+ for body text), all interactive elements are real `<button>`/`<label>` elements (keyboard-operable by default), icon-only buttons carry `aria-label`, the signature footprint visual has a descriptive `aria-label` summarizing the data it encodes, `prefers-reduced-motion` respected.

## Emission factor sources

See inline citations in `backend/app/services/emission_factors.py`. Primary sources: EPA "Greenhouse Gas Emissions from a Typical Passenger Vehicle," EPA Greenhouse Gas Equivalencies Calculator (eGRID grid intensity), EPA Emission Factors for Greenhouse Gas Inventories (transit, natural gas), and widely cited food-system lifecycle assessment figures for diet-category comparisons.

## Known limitations / next steps

- Electricity factor uses a flat US national average rather than the user's actual regional grid mix (eGRID subregion) — a real next step would be to ask for a ZIP code and look up the subregion factor.
- No password-reset flow (out of scope for a hackathon demo).
- Insights engine currently runs a fixed rule list; a natural extension is letting users mark a suggestion "done" and tracking adherence over time.
