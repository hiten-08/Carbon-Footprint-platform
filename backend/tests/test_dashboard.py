def test_summary_empty_state(client, auth_headers):
    resp = client.get("/api/dashboard/summary", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_kg_co2e"] == 0
    assert body["entry_count"] == 0
    assert body["breakdown"] == []
    assert len(body["insights"]) >= 1  # always returns at least an onboarding tip


def test_summary_aggregates_totals_and_breakdown(client, auth_headers):
    client.post(
        "/api/entries",
        json={"activity": "car_gasoline", "quantity": 10, "logged_for_date": "2026-06-01"},
        headers=auth_headers,
    )
    client.post(
        "/api/entries",
        json={"activity": "electricity", "quantity": 5, "logged_for_date": "2026-06-01"},
        headers=auth_headers,
    )

    resp = client.get("/api/dashboard/summary", headers=auth_headers)
    body = resp.json()

    # 10 * 0.40 + 5 * 0.40 = 6.0
    assert body["total_kg_co2e"] == 6.0
    assert body["entry_count"] == 2
    categories = {b["category"] for b in body["breakdown"]}
    assert categories == {"transport", "energy"}


def test_summary_respects_days_window(client, auth_headers):
    # An entry far in the past should be excluded by a short days window.
    client.post(
        "/api/entries",
        json={"activity": "car_gasoline", "quantity": 10, "logged_for_date": "2020-01-01"},
        headers=auth_headers,
    )
    resp = client.get("/api/dashboard/summary?days=7", headers=auth_headers)
    assert resp.json()["total_kg_co2e"] == 0


def test_summary_requires_auth(client):
    resp = client.get("/api/dashboard/summary")
    assert resp.status_code == 401
