"""Tests for AI usage tracking (balance, deduct, history)."""

import pytest

# ---------------------------------------------------------------------------
# Helpers (reuse auth test pattern)
# ---------------------------------------------------------------------------

PHONE = "13800138000"
PASSWORD = "test123456"


def _register(client) -> dict:
    """Register a fresh user (send code once) and return token response."""
    resp = client.post("/api/auth/send-code", json={"phone": PHONE})
    assert resp.status_code == 200
    code = resp.json()["code"]

    resp = client.post(
        "/api/auth/register",
        json={"phone": PHONE, "password": PASSWORD, "code": code},
    )
    assert resp.status_code == 201
    return resp.json()


def _auth_header(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def _register_with_phone(client, phone: str) -> dict:
    """Register a user with a specific phone number."""
    resp = client.post("/api/auth/send-code", json={"phone": phone})
    assert resp.status_code == 200
    code = resp.json()["code"]

    resp = client.post(
        "/api/auth/register",
        json={"phone": phone, "password": PASSWORD, "code": code},
    )
    assert resp.status_code == 201
    return resp.json()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestBalance:
    def test_new_user_gets_free_credits(self, client):
        tokens = _register(client)
        resp = client.get(
            "/api/usage/balance", headers=_auth_header(tokens)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["image_credits"] == 10
        assert data["text_credits"] == 5


class TestDeductCredits:
    def test_deduct_image_credits(self, client, db_session):
        """Deduct image credits and verify balance and usage record."""
        from app.models.user_ai_balance import UserAIBalance
        from app.models.user_ai_usage import UserAIUsage
        from app.services.usage import deduct_credits

        tokens = _register(client)
        resp = client.get("/api/auth/me", headers=_auth_header(tokens))
        user_id = resp.json()["id"]

        # Deduct 3 image credits
        usage = deduct_credits(
            db=db_session,
            user_id=user_id,
            action_type="image_gen",
            credits_used=3,
            api_cost=0.0015,
            metadata={"model": "dall-e-3", "resolution": "1024x1024"},
        )
        db_session.flush()

        # Check usage record
        assert usage.action_type == "image_gen"
        assert usage.credits_used == 3
        assert usage.api_cost == 0.0015
        assert usage.metadata_ is not None
        assert usage.metadata_["model"] == "dall-e-3"

        # Check balance decreased
        balance = (
            db_session.query(UserAIBalance)
            .filter_by(user_id=user_id)
            .first()
        )
        assert balance.image_credits == 7  # 10 - 3
        assert balance.text_credits == 5  # unchanged

    def test_deduct_text_credits(self, client, db_session):
        """Deduct text credits and verify."""
        from app.models.user_ai_balance import UserAIBalance
        from app.services.usage import deduct_credits

        tokens = _register(client)
        resp = client.get("/api/auth/me", headers=_auth_header(tokens))
        user_id = resp.json()["id"]

        usage = deduct_credits(
            db=db_session,
            user_id=user_id,
            action_type="text_gen",
            credits_used=2,
        )
        db_session.flush()

        assert usage.action_type == "text_gen"
        assert usage.credits_used == 2

        balance = (
            db_session.query(UserAIBalance)
            .filter_by(user_id=user_id)
            .first()
        )
        assert balance.text_credits == 3  # 5 - 2
        assert balance.image_credits == 10  # unchanged

    def test_deduct_insufficient_credits(self, client, db_session):
        """Attempt to deduct more credits than available."""
        from app.services.usage import deduct_credits

        tokens = _register(client)
        resp = client.get("/api/auth/me", headers=_auth_header(tokens))
        user_id = resp.json()["id"]

        with pytest.raises(ValueError, match="Insufficient"):
            deduct_credits(
                db=db_session,
                user_id=user_id,
                action_type="image_gen",
                credits_used=100,  # way more than 10
            )

    def test_deduct_zero_balance_user(self, client, db_session):
        """User with no balance record should get one created."""
        from app.models.user_ai_balance import UserAIBalance
        from app.services.usage import deduct_credits

        # create a user directly (no auto-balance)
        from app.models.user import User
        from app.services.auth import hash_password

        user = User(
            phone="13900139001",
            password_hash=hash_password("test123456"),
            role="user",
        )
        db_session.add(user)
        db_session.flush()
        user_id = user.id

        # Deduct 0 credits to trigger balance creation
        usage = deduct_credits(
            db=db_session,
            user_id=user_id,
            action_type="text_gen",
            credits_used=0,
        )
        db_session.flush()

        balance = (
            db_session.query(UserAIBalance)
            .filter_by(user_id=user_id)
            .first()
        )
        assert balance is not None
        assert balance.image_credits == 0
        assert balance.text_credits == 0


class TestGetBalanceEndpoint:
    def test_get_balance_endpoint(self, client):
        tokens = _register(client)
        resp = client.get(
            "/api/usage/balance", headers=_auth_header(tokens)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["image_credits"] == 10
        assert data["text_credits"] == 5


class TestGetUsageHistory:
    def test_get_usage_history(self, client, db_session):
        from app.services.usage import deduct_credits

        tokens = _register(client)
        resp = client.get("/api/auth/me", headers=_auth_header(tokens))
        user_id = resp.json()["id"]

        # Create a couple of usage records
        deduct_credits(
            db=db_session,
            user_id=user_id,
            action_type="image_gen",
            credits_used=2,
            api_cost=0.001,
        )
        deduct_credits(
            db=db_session,
            user_id=user_id,
            action_type="text_gen",
            credits_used=1,
        )
        db_session.commit()

        # Fetch history via API
        resp = client.get(
            "/api/usage/history", headers=_auth_header(tokens)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["records"]) == 2
        # Both action types should be present (order may vary with same timestamp)
        action_types = {r["action_type"] for r in data["records"]}
        assert action_types == {"image_gen", "text_gen"}

    def test_usage_history_pagination(self, client, db_session):
        from app.services.usage import deduct_credits

        tokens = _register(client)
        resp = client.get("/api/auth/me", headers=_auth_header(tokens))
        user_id = resp.json()["id"]

        # Create 3 usage records
        for i in range(3):
            deduct_credits(
                db=db_session,
                user_id=user_id,
                action_type="image_gen",
                credits_used=1,
            )
        db_session.commit()

        # Fetch with limit=2
        resp = client.get(
            "/api/usage/history?limit=2", headers=_auth_header(tokens)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["records"]) == 2
        assert data["limit"] == 2
        assert data["offset"] == 0
        assert data["total"] == 3


class TestUsageSummary:
    def test_summary_empty(self, client):
        tokens = _register(client)
        resp = client.get(
            "/api/usage/summary", headers=_auth_header(tokens)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_images"] == 0
        assert data["total_text_generations"] == 0
        assert data["total_api_cost"] == 0
        assert data["period"] == "current_month"

    def test_summary_with_usage(self, client, db_session):
        from app.services.usage import deduct_credits

        tokens = _register(client)
        resp = client.get("/api/auth/me", headers=_auth_header(tokens))
        user_id = resp.json()["id"]

        # Create some usage records
        deduct_credits(
            db=db_session,
            user_id=user_id,
            action_type="image_gen",
            credits_used=2,
            api_cost=0.002,
        )
        deduct_credits(
            db=db_session,
            user_id=user_id,
            action_type="image_gen",
            credits_used=3,
            api_cost=0.003,
        )
        deduct_credits(
            db=db_session,
            user_id=user_id,
            action_type="text_gen",
            credits_used=1,
            api_cost=0.0005,
        )
        db_session.commit()

        resp = client.get(
            "/api/usage/summary", headers=_auth_header(tokens)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_images"] == 2  # 2 image_gen records
        assert data["total_text_generations"] == 1
        assert data["total_api_cost"] == 0.0055  # 0.002 + 0.003 + 0.0005
        assert data["period"] == "current_month"


class TestUnauthorizedAccess:
    def test_balance_without_token_returns_403(self, client):
        resp = client.get("/api/usage/balance")
        assert resp.status_code == 403

    def test_history_without_token_returns_403(self, client):
        resp = client.get("/api/usage/history")
        assert resp.status_code == 403

    def test_summary_without_token_returns_403(self, client):
        resp = client.get("/api/usage/summary")
        assert resp.status_code == 403

    def test_balance_with_invalid_token_returns_401(self, client):
        resp = client.get(
            "/api/usage/balance",
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert resp.status_code == 401

    def test_history_with_invalid_token_returns_401(self, client):
        resp = client.get(
            "/api/usage/history",
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert resp.status_code == 401
