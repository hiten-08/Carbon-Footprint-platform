def _register(client, email="entries@example.com"):
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "display_name": "E", "password": "password123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_entry_computes_co2e_correctly(client, auth_headers):
    resp = client.post(
        "/api/entries",
        json={
            "activity": "car_gasoline",
            "quantity": 10,
            "logged_for_date": "2026-06-01",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    # car_gasoline factor is 0.40 kg/mile -> 10 miles = 4.0 kg
    assert body["co2e_kg"] == 4.0
    assert body["category"] == "transport"
    assert body["unit"] == "mile"


def test_create_entry_rejects_unknown_activity(client, auth_headers):
    resp = client.post(
        "/api/entries",
        json={"activity": "teleportation", "quantity": 1, "logged_for_date": "2026-06-01"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_create_entry_rejects_negative_quantity(client, auth_headers):
    resp = client.post(
        "/api/entries",
        json={"activity": "car_gasoline", "quantity": -5, "logged_for_date": "2026-06-01"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


def test_list_entries_returns_only_own_entries(client):
    headers_a = _register(client, "userA@example.com")
    headers_b = _register(client, "userB@example.com")

    client.post(
        "/api/entries",
        json={"activity": "electricity", "quantity": 20, "logged_for_date": "2026-06-01"},
        headers=headers_a,
    )
    client.post(
        "/api/entries",
        json={"activity": "electricity", "quantity": 99, "logged_for_date": "2026-06-01"},
        headers=headers_b,
    )

    resp_a = client.get("/api/entries", headers=headers_a)
    assert resp_a.status_code == 200
    assert len(resp_a.json()) == 1
    assert resp_a.json()[0]["quantity"] == 20


def test_delete_entry_removes_it(client, auth_headers):
    create_resp = client.post(
        "/api/entries",
        json={"activity": "waste_landfill", "quantity": 2, "logged_for_date": "2026-06-01"},
        headers=auth_headers,
    )
    entry_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/entries/{entry_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    list_resp = client.get("/api/entries", headers=auth_headers)
    assert list_resp.json() == []


def test_delete_entry_cannot_delete_other_users_entry(client):
    headers_a = _register(client, "owner@example.com")
    headers_b = _register(client, "intruder@example.com")

    create_resp = client.post(
        "/api/entries",
        json={"activity": "waste_landfill", "quantity": 2, "logged_for_date": "2026-06-01"},
        headers=headers_a,
    )
    entry_id = create_resp.json()["id"]

    del_resp = client.delete(f"/api/entries/{entry_id}", headers=headers_b)
    assert del_resp.status_code == 404

    # entry should still exist for the real owner
    list_resp = client.get("/api/entries", headers=headers_a)
    assert len(list_resp.json()) == 1


def test_delete_nonexistent_entry_returns_404(client, auth_headers):
    resp = client.delete("/api/entries/does-not-exist", headers=auth_headers)
    assert resp.status_code == 404
