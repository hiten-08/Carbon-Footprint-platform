def test_register_creates_user_and_returns_token(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "a@example.com", "display_name": "A", "password": "password123"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["access_token"]
    assert body["user"]["email"] == "a@example.com"


def test_register_duplicate_email_rejected(client):
    payload = {"email": "dupe@example.com", "display_name": "A", "password": "password123"}
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400


def test_register_rejects_short_password(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "b@example.com", "display_name": "B", "password": "short"},
    )
    assert resp.status_code == 422


def test_login_succeeds_with_correct_credentials(client):
    client.post(
        "/api/auth/register",
        json={"email": "c@example.com", "display_name": "C", "password": "password123"},
    )
    resp = client.post(
        "/api/auth/login", json={"email": "c@example.com", "password": "password123"}
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_login_fails_with_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"email": "d@example.com", "display_name": "D", "password": "password123"},
    )
    resp = client.post(
        "/api/auth/login", json={"email": "d@example.com", "password": "wrongpassword"}
    )
    assert resp.status_code == 401


def test_login_fails_for_unknown_email(client):
    resp = client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": "password123"}
    )
    assert resp.status_code == 401


def test_protected_route_rejects_missing_token(client):
    resp = client.get("/api/entries")
    assert resp.status_code == 401


def test_protected_route_rejects_garbage_token(client):
    resp = client.get("/api/entries", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401
