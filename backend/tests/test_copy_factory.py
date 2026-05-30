"""Tests for the Copy Factory API (title, bullets, description, keywords)."""

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PHONE_BASE = 13800138100  # base number; each test bumps it


def _register(client, phone: str | None = None) -> dict:
    """Register a fresh user and return token response."""
    phone = phone or "13800138000"
    resp = client.post("/api/auth/send-code", json={"phone": phone})
    assert resp.status_code == 200
    code = resp.json()["code"]

    resp = client.post(
        "/api/auth/register",
        json={"phone": phone, "password": "test123456", "code": code},
    )
    assert resp.status_code == 201
    return resp.json()


def _auth_header(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


# Shared minimal product context for DeepSeek tests (keep prompts cheap)
_MINIMAL_PRODUCT = {
    "product_name": "Stainless Steel Water Bottle",
    "category": "Sports & Outdoors",
    "features": ["32oz capacity", "double-wall insulation", "leak-proof lid", "BPA-free"],
    "target_market": "US",
    "language": "en",
    "keywords": ["insulated water bottle", "stainless steel tumbler", "eco-friendly"],
}


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestListSkills:
    def test_list_skills(self, client):
        """GET /api/copy-factory/skills returns expected structure."""
        resp = client.get("/api/copy-factory/skills")
        assert resp.status_code == 200
        data = resp.json()
        assert "title" in data
        assert "bullet" in data
        assert "description" in data
        assert "keyword" in data
        assert "deepseek" in data["title"]
        assert "mock" in data["keyword"]


class TestGenerateTitle:
    def test_generate_title(self, client):
        """POST with product context, get title back with correct structure."""
        tokens = _register(client)
        resp = client.post(
            "/api/copy-factory/generate-title",
            json=_MINIMAL_PRODUCT,
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "title" in data
        assert len(data["title"]) > 0
        assert "char_count" in data
        assert data["char_count"] > 0
        assert "keywords_included" in data

    def test_generate_title_invalid_market(self, client):
        """POST with an invalid market, expect 422."""
        tokens = _register(client)
        body = {**_MINIMAL_PRODUCT, "target_market": "XX"}
        resp = client.post(
            "/api/copy-factory/generate-title",
            json=body,
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 422


class TestGenerateBullets:
    def test_generate_bullets(self, client):
        """POST with product context, get 5 bullets."""
        tokens = _register(client)
        resp = client.post(
            "/api/copy-factory/generate-bullets",
            json=_MINIMAL_PRODUCT,
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "bullets" in data
        assert len(data["bullets"]) == 5
        for b in data["bullets"]:
            assert len(b) > 0


class TestGenerateDescription:
    def test_generate_description(self, client):
        """POST with product context, get description with HTML."""
        tokens = _register(client)
        resp = client.post(
            "/api/copy-factory/generate-description",
            json=_MINIMAL_PRODUCT,
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "description" in data
        assert len(data["description"]) > 0
        assert "word_count" in data
        assert data["word_count"] > 0


class TestGenerateAll:
    def test_generate_all_three_sections(self, client):
        """POST generate-all, get title + bullets + description (skip keywords to save cost)."""
        tokens = _register(client)
        body = {
            "product": _MINIMAL_PRODUCT,
            "sections": ["title", "bullets", "description"],
        }
        resp = client.post(
            "/api/copy-factory/generate-all",
            json=body,
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "title" in data
        assert data["title"] is not None
        assert "bullets" in data
        assert data["bullets"] is not None
        assert len(data["bullets"]["bullets"]) == 5
        assert "description" in data
        assert data["description"] is not None
        assert data["description"]["word_count"] > 0
        # keywords not requested
        assert "keywords" not in data or data["keywords"] is None

    def test_generate_all_with_keywords(self, client):
        """POST generate-all with all four sections (deepseek provider)."""
        tokens = _register(client)
        body = {
            "product": _MINIMAL_PRODUCT,
            "sections": ["title", "bullets", "description", "keywords"],
        }
        resp = client.post(
            "/api/copy-factory/generate-all",
            json=body,
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "keywords" in data
        assert data["keywords"] is not None
        assert len(data["keywords"]["keywords"]) >= 20


class TestKeywords:
    def test_keywords_mock(self, client):
        """POST keywords with mock provider, get 20-30 keywords."""
        tokens = _register(client)
        body = {**_MINIMAL_PRODUCT, "provider": "mock"}
        resp = client.post(
            "/api/copy-factory/keywords",
            json=body,
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "keywords" in data
        assert 20 <= len(data["keywords"]) <= 30
        for kw in data["keywords"]:
            assert "keyword" in kw
            assert "search_volume" in kw
            assert kw["search_volume"] in ("high", "medium", "low")
            assert "competition" in kw
            assert kw["competition"] in ("high", "medium", "low")
            assert "implanted" in kw
            assert isinstance(kw["implanted"], bool)

    def test_keywords_deepseek(self, client):
        """POST keywords with deepseek provider, get 20-30 keywords."""
        tokens = _register(client)
        resp = client.post(
            "/api/copy-factory/keywords",
            json=_MINIMAL_PRODUCT,
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "keywords" in data
        assert 20 <= len(data["keywords"]) <= 30
        for kw in data["keywords"]:
            assert "keyword" in kw
            assert "search_volume" in kw
            assert kw["search_volume"] in ("high", "medium", "low")
            assert "competition" in kw
            assert kw["competition"] in ("high", "medium", "low")
            assert "implanted" in kw
            assert isinstance(kw["implanted"], bool)


class TestOptimize:
    def test_optimize(self, client):
        """POST with content + keyword, get rewritten content."""
        tokens = _register(client)
        body = {
            "content": "This water bottle keeps your drinks cold all day.",
            "target_keyword": "insulated water bottle",
            "section": "description",
        }
        resp = client.post(
            "/api/copy-factory/optimize",
            json=body,
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "optimized" in data
        assert len(data["optimized"]) > 0


class TestConfirm:
    def test_confirm_deducts_credit(self, client, db_session):
        """Register user (has 5 text credits), confirm, check balance = 4."""
        from app.models.user_ai_balance import UserAIBalance

        tokens = _register(client)

        resp = client.post(
            "/api/copy-factory/confirm",
            json={},
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["credits_deducted"] == 1

        # Verify balance via DB
        resp = client.get("/api/auth/me", headers=_auth_header(tokens))
        user_id = resp.json()["id"]
        balance = (
            db_session.query(UserAIBalance)
            .filter_by(user_id=user_id)
            .first()
        )
        assert balance.text_credits == 4  # 5 - 1
        assert balance.image_credits == 10  # unchanged


class TestUnauthorized:
    def test_list_skills_no_auth_ok(self, client):
        """GET /skills does not require auth."""
        resp = client.get("/api/copy-factory/skills")
        assert resp.status_code == 200

    def test_generate_title_without_token_returns_403(self, client):
        """POST generate-title without auth token."""
        resp = client.post(
            "/api/copy-factory/generate-title",
            json=_MINIMAL_PRODUCT,
        )
        assert resp.status_code == 403

    def test_generate_bullets_without_token_returns_403(self, client):
        """POST generate-bullets without auth token."""
        resp = client.post(
            "/api/copy-factory/generate-bullets",
            json=_MINIMAL_PRODUCT,
        )
        assert resp.status_code == 403

    def test_generate_description_without_token_returns_403(self, client):
        """POST generate-description without auth token."""
        resp = client.post(
            "/api/copy-factory/generate-description",
            json=_MINIMAL_PRODUCT,
        )
        assert resp.status_code == 403

    def test_generate_all_without_token_returns_403(self, client):
        """POST generate-all without auth token."""
        resp = client.post(
            "/api/copy-factory/generate-all",
            json={"product": _MINIMAL_PRODUCT},
        )
        assert resp.status_code == 403

    def test_keywords_without_token_returns_403(self, client):
        """POST keywords without auth token."""
        resp = client.post(
            "/api/copy-factory/keywords",
            json=_MINIMAL_PRODUCT,
        )
        assert resp.status_code == 403

    def test_confirm_without_token_returns_403(self, client):
        """POST confirm without auth token."""
        resp = client.post(
            "/api/copy-factory/confirm",
            json={},
        )
        assert resp.status_code == 403

    def test_generate_title_with_invalid_token_returns_401(self, client):
        """POST with invalid token."""
        resp = client.post(
            "/api/copy-factory/generate-title",
            json=_MINIMAL_PRODUCT,
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert resp.status_code == 401

    def test_confirm_with_invalid_token_returns_401(self, client):
        """POST confirm with invalid token."""
        resp = client.post(
            "/api/copy-factory/confirm",
            json={},
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert resp.status_code == 401
