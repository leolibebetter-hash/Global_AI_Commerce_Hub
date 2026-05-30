"""Tests for the auth API (registration, login, token refresh, logout)."""

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PHONE = "13800138000"
PASSWORD = "test123456"


def _send_code(client) -> str:
    """Return the SMS code returned by send-code."""
    resp = client.post("/api/auth/send-code", json={"phone": PHONE})
    assert resp.status_code == 200
    return resp.json()["code"]


def _register(client, code: str | None = None) -> dict:
    """Register and return the token response dict."""
    if code is None:
        code = _send_code(client)
    body = {"phone": PHONE, "password": PASSWORD, "code": code}
    resp = client.post("/api/auth/register", json=body)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestSendCode:
    def test_send_code_returns_200(self, client):
        resp = client.post("/api/auth/send-code", json={"phone": PHONE})
        assert resp.status_code == 200
        data = resp.json()
        assert "code" in data
        assert len(data["code"]) == 6


class TestRegister:
    def test_register_success(self, client):
        tokens = _register(client)
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["token_type"] == "bearer"

    def test_duplicate_phone(self, client):
        code = _send_code(client)
        _register(client, code)  # first registration succeeds

        # Second attempt with same phone
        code2 = _send_code(client)
        resp = client.post(
            "/api/auth/register",
            json={"phone": PHONE, "password": PASSWORD, "code": code2},
        )
        assert resp.status_code == 409
        assert "already registered" in resp.text.lower()

    def test_missing_fields_returns_422(self, client):
        resp = client.post("/api/auth/register", json={"phone": PHONE})
        assert resp.status_code == 422

    def test_invalid_code_returns_400(self, client):
        resp = client.post(
            "/api/auth/register",
            json={"phone": "13800138001", "password": PASSWORD, "code": "000000"},
        )
        assert resp.status_code == 400
        assert "code" in resp.text.lower()


class TestLogin:
    def test_register_and_login(self, client):
        # Register a user first
        tokens = _register(client)
        assert tokens["access_token"] is not None

        # Login
        resp = client.post(
            "/api/auth/login", json={"phone": PHONE, "password": PASSWORD}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    def test_login_invalid_password(self, client):
        _register(client)

        resp = client.post(
            "/api/auth/login", json={"phone": PHONE, "password": "wrongpass1"}
        )
        assert resp.status_code == 401

    def test_login_invalid_phone(self, client):
        resp = client.post(
            "/api/auth/login",
            json={"phone": "13900139000", "password": PASSWORD},
        )
        assert resp.status_code == 401


class TestMe:
    def test_me_returns_user(self, client):
        tokens = _register(client)
        resp = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["phone"] == PHONE
        assert data["role"] == "user"
        assert data["is_active"] is True
        assert "id" in data

    def test_me_without_token_returns_403(self, client):
        """HTTPBearer returns 403 when no Authorization header is present."""
        resp = client.get("/api/auth/me")
        assert resp.status_code == 403

    def test_me_with_invalid_token_returns_401(self, client):
        resp = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert resp.status_code == 401


class TestRefresh:
    def test_refresh_token(self, client):
        tokens = _register(client)

        resp = client.post(
            "/api/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
        )
        assert resp.status_code == 200
        new_tokens = resp.json()
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
        # The refresh token should have been rotated
        assert new_tokens["refresh_token"] != tokens["refresh_token"]

    def test_refresh_with_stale_token_fails(self, client):
        tokens = _register(client)

        # First refresh — consumes old token
        client.post(
            "/api/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
        )

        # Second refresh with same (now-stale) token should fail
        resp = client.post(
            "/api/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
        )
        assert resp.status_code == 401

    def test_refresh_with_invalid_token_returns_401(self, client):
        resp = client.post(
            "/api/auth/refresh",
            json={"refresh_token": "not-a-real-jwt"},
        )
        assert resp.status_code == 401


class TestLogout:
    def test_logout(self, client):
        tokens = _register(client)

        # Logout
        resp = client.post(
            "/api/auth/logout",
            json={"refresh_token": tokens["refresh_token"]},
        )
        assert resp.status_code == 200

        # Refresh with the logged-out token should fail
        resp = client.post(
            "/api/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
        )
        assert resp.status_code == 401
