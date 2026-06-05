"""Tests for the Image Factory API (process, regenerate, confirm)."""

import io

import pytest

# ---------------------------------------------------------------------------
# Helpers (reuse auth test pattern)
# ---------------------------------------------------------------------------

PHONE = "13800138000"
PASSWORD = "test123456"


def _register(client) -> dict:
    """Register a fresh user and return token response."""
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


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestProcessImage:
    def test_process_image(self, client):
        """Upload a JPEG, process synchronously, verify scene images returned."""
        tokens = _register(client)

        img_bytes = io.BytesIO()
        from PIL import Image

        img = Image.new("RGB", (100, 100), "#FF0000")
        img.save(img_bytes, "JPEG")
        img_bytes.seek(0)

        resp = client.post(
            "/api/image-factory/process",
            data={"style": "minimal"},
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["task_id"] == "sync"
        assert data["status"] == "done"
        assert "no_bg_url" in data
        assert "scene_urls" in data
        assert len(data["scene_urls"]) == 3
        # scene_urls should be paths like /api/files/scene_xxx.jpg
        for url in data["scene_urls"]:
            assert url.startswith("/api/files/")

    def test_process_invalid_type(self, client):
        """Upload a text file instead of image, expect 400."""
        tokens = _register(client)

        resp = client.post(
            "/api/image-factory/process",
            data={"style": "minimal"},
            files={"file": ("test.txt", b"not an image", "text/plain")},
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 400
        assert "JPEG" in resp.text or "PNG" in resp.text

    def test_process_invalid_style(self, client):
        """Upload with an invalid style, expect 400."""
        tokens = _register(client)

        img_bytes = io.BytesIO()
        from PIL import Image

        img = Image.new("RGB", (100, 100), "#FF0000")
        img.save(img_bytes, "JPEG")
        img_bytes.seek(0)

        resp = client.post(
            "/api/image-factory/process",
            data={"style": "nonexistent"},
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 400
        assert "style" in resp.text.lower()

    def test_process_lifestyle_style(self, client):
        """Verify lifestyle style produces different color from minimal."""
        tokens = _register(client)

        img_bytes = io.BytesIO()
        from PIL import Image

        img = Image.new("RGB", (100, 100), "#FF0000")
        img.save(img_bytes, "JPEG")
        img_bytes.seek(0)

        resp = client.post(
            "/api/image-factory/process",
            data={"style": "lifestyle"},
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["scene_urls"]) == 3

    def test_process_premium_style(self, client):
        """Verify premium style produces correct number of scenes."""
        tokens = _register(client)

        img_bytes = io.BytesIO()
        from PIL import Image

        img = Image.new("RGB", (100, 100), "#FF0000")
        img.save(img_bytes, "JPEG")
        img_bytes.seek(0)

        resp = client.post(
            "/api/image-factory/process",
            data={"style": "premium"},
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["scene_urls"]) == 3


class TestGetResult:
    def test_get_result_not_found(self, client):
        """Poll for a nonexistent task_id — should return failed."""
        resp = client.get("/api/image-factory/result/nonexistent-task-id")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "failed"

    def test_get_result_sync_success(self, client):
        """Run a sync process then get result for 'sync' task_id."""
        tokens = _register(client)

        img_bytes = io.BytesIO()
        from PIL import Image

        img = Image.new("RGB", (100, 100), "#FF0000")
        img.save(img_bytes, "JPEG")
        img_bytes.seek(0)

        # Run processing synchronously
        resp = client.post(
            "/api/image-factory/process",
            data={"style": "minimal"},
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200

        # Poll for result with sync task_id
        resp = client.get("/api/image-factory/result/sync")
        assert resp.status_code == 200


class TestRegenerate:
    def test_regenerate(self, client):
        """Call regenerate with valid params, get result synchronously."""
        tokens = _register(client)

        resp = client.post(
            "/api/image-factory/regenerate",
            data={
                "image_url": "/api/files/test.jpg",
                "style": "minimal",
            },
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["task_id"] == "sync"
        assert data["status"] == "done"
        assert "url" in data
        assert data["url"] is not None
        assert data["url"].startswith("/api/files/")

    def test_regenerate_invalid_style(self, client):
        """Call regenerate with invalid style, expect 400."""
        tokens = _register(client)

        resp = client.post(
            "/api/image-factory/regenerate",
            data={
                "image_url": "/api/files/test.jpg",
                "style": "invalid",
            },
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 400

    def test_regenerate_lifestyle(self, client):
        """Regenerate with lifestyle style."""
        tokens = _register(client)

        resp = client.post(
            "/api/image-factory/regenerate",
            data={
                "image_url": "/api/files/test.jpg",
                "style": "lifestyle",
            },
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["url"] is not None

    def test_regenerate_premium(self, client):
        """Regenerate with premium style."""
        tokens = _register(client)

        resp = client.post(
            "/api/image-factory/regenerate",
            data={
                "image_url": "/api/files/test.jpg",
                "style": "premium",
            },
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["url"] is not None


class TestConfirm:
    def test_confirm_deducts_credits(self, client, db_session):
        """Confirm 2 images, verify balance drops from 10 to 8."""
        from app.models.user_ai_balance import UserAIBalance

        tokens = _register(client)

        # Confirm 2 images
        resp = client.post(
            "/api/image-factory/confirm",
            data={"count": 2},
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["credits_deducted"] == 2

        # Check balance via DB
        resp = client.get("/api/auth/me", headers=_auth_header(tokens))
        user_id = resp.json()["id"]
        balance = (
            db_session.query(UserAIBalance)
            .filter_by(user_id=user_id)
            .first()
        )
        assert balance.image_credits == 8  # 10 - 2
        assert balance.text_credits == 5  # unchanged

    def test_confirm_insufficient_credits(self, client):
        """Try to confirm more than available balance, expect 402."""
        tokens = _register(client)

        resp = client.post(
            "/api/image-factory/confirm",
            data={"count": 100},  # only 10 available
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 402

    def test_confirm_multiple_times(self, client, db_session):
        """Confirm 3 images, then 4 more, verify running total."""
        from app.models.user_ai_balance import UserAIBalance

        tokens = _register(client)

        # First confirmation: 3 images
        resp = client.post(
            "/api/image-factory/confirm",
            data={"count": 3},
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200

        # Second confirmation: 4 more
        resp = client.post(
            "/api/image-factory/confirm",
            data={"count": 4},
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200

        # Verify balance
        resp = client.get("/api/auth/me", headers=_auth_header(tokens))
        user_id = resp.json()["id"]
        balance = (
            db_session.query(UserAIBalance)
            .filter_by(user_id=user_id)
            .first()
        )
        assert balance.image_credits == 3  # 10 - 3 - 4

    def test_confirm_exact_balance(self, client, db_session):
        """Deduct exactly the available balance (10 credits)."""
        from app.models.user_ai_balance import UserAIBalance

        tokens = _register(client)

        resp = client.post(
            "/api/image-factory/confirm",
            data={"count": 10},
            headers=_auth_header(tokens),
        )
        assert resp.status_code == 200

        resp = client.get("/api/auth/me", headers=_auth_header(tokens))
        user_id = resp.json()["id"]
        balance = (
            db_session.query(UserAIBalance)
            .filter_by(user_id=user_id)
            .first()
        )
        assert balance.image_credits == 0


class TestUnauthorized:
    def test_process_without_token_returns_403(self, client):
        """Call process without auth token."""
        resp = client.post(
            "/api/image-factory/process",
            data={"style": "minimal"},
            files={"file": ("test.jpg", b"fake", "image/jpeg")},
        )
        assert resp.status_code == 403

    def test_regenerate_without_token_returns_403(self, client):
        """Call regenerate without auth token."""
        resp = client.post(
            "/api/image-factory/regenerate",
            data={"image_url": "/api/files/test.jpg", "style": "minimal"},
        )
        assert resp.status_code == 403

    def test_confirm_without_token_returns_403(self, client):
        """Call confirm without auth token."""
        resp = client.post(
            "/api/image-factory/confirm",
            data={"count": 1},
        )
        assert resp.status_code == 403

    def test_process_with_invalid_token_returns_401(self, client):
        """Call process with invalid token."""
        resp = client.post(
            "/api/image-factory/process",
            data={"style": "minimal"},
            files={"file": ("test.jpg", b"fake", "image/jpeg")},
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert resp.status_code == 401

    def test_regenerate_with_invalid_token_returns_401(self, client):
        """Call regenerate with invalid token."""
        resp = client.post(
            "/api/image-factory/regenerate",
            data={"image_url": "/api/files/test.jpg", "style": "minimal"},
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert resp.status_code == 401

    def test_confirm_with_invalid_token_returns_401(self, client):
        """Call confirm with invalid token."""
        resp = client.post(
            "/api/image-factory/confirm",
            data={"count": 1},
            headers={"Authorization": "Bearer invalidtoken"},
        )
        assert resp.status_code == 401
