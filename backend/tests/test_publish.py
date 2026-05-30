"""Tests for Amazon account linking and publishing flow."""

import json
import time

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _register(client, phone: str | None = None) -> dict:
    """Register a fresh user and return token response."""
    phone = phone or "13800138200"
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


def _get_user_id(client, tokens: dict) -> str:
    """Fetch user ID from /api/auth/me."""
    resp = client.get("/api/auth/me", headers=_auth_header(tokens))
    assert resp.status_code == 200
    return resp.json()["id"]


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestConnectAmazon:
    def test_connect_amazon(self, client):
        """POST /api/amazon/connect, then GET /api/amazon/status returns connected."""
        tokens = _register(client)
        headers = _auth_header(tokens)

        resp = client.post("/api/amazon/connect", params={"seller_id": "SELLER123"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "connected"
        assert resp.json()["seller_id"] == "SELLER123"

        # Verify status
        resp = client.get("/api/amazon/status", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["connected"] is True
        assert data["seller_id"] == "SELLER123"

    def test_duplicate_connect(self, client):
        """Connect twice should return 400."""
        tokens = _register(client)
        headers = _auth_header(tokens)

        client.post("/api/amazon/connect", params={"seller_id": "SELLER123"}, headers=headers)
        resp = client.post("/api/amazon/connect", params={"seller_id": "SELLER456"}, headers=headers)
        assert resp.status_code == 400
        assert "already connected" in resp.json()["detail"].lower()

    def test_disconnect(self, client):
        """Connect then disconnect, status shows not connected."""
        tokens = _register(client)
        headers = _auth_header(tokens)

        client.post("/api/amazon/connect", params={"seller_id": "SELLER123"}, headers=headers)

        resp = client.post("/api/amazon/disconnect", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "disconnected"

        resp = client.get("/api/amazon/status", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["connected"] is False

    def test_disconnect_without_account(self, client):
        """Disconnect without having connected returns 404."""
        tokens = _register(client)
        headers = _auth_header(tokens)

        resp = client.post("/api/amazon/disconnect", headers=headers)
        assert resp.status_code == 404


class TestPublish:
    def test_publish_without_account(self, client):
        """Try to publish without connecting, expect 400."""
        tokens = _register(client)
        headers = _auth_header(tokens)

        resp = client.post(
            "/api/publish/create",
            params={
                "title": "Test Product",
                "bullets": json.dumps(["Feature 1", "Feature 2"]),
                "description": "A great product",
                "images": json.dumps(["https://example.com/img.jpg"]),
                "sku": "TEST001",
                "price": 29.99,
                "quantity": 10,
                "category": "Electronics",
            },
            headers=headers,
        )
        assert resp.status_code == 400
        assert "No Amazon account" in resp.json()["detail"]

    def test_publish_success(self, client, db_session):
        """Connect, then publish, verify ASIN returned and record in DB."""
        from app.models.publish_record import PublishRecord

        tokens = _register(client)
        headers = _auth_header(tokens)

        # Connect first
        client.post("/api/amazon/connect", params={"seller_id": "SELLER123"}, headers=headers)

        # Publish
        resp = client.post(
            "/api/publish/create",
            params={
                "title": "Stainless Steel Bottle",
                "bullets": json.dumps(["32oz capacity", "BPA-free"]),
                "description": "Premium insulated water bottle.",
                "images": json.dumps(["https://example.com/bottle.jpg"]),
                "sku": "BOTTLE001",
                "price": 24.99,
                "quantity": 50,
                "category": "Sports & Outdoors",
            },
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "published"
        assert data["asin"] is not None
        assert data["asin"].startswith("B")
        assert data["seller_central_url"] is not None

        # Verify DB record
        record = db_session.query(PublishRecord).filter_by(asin=data["asin"]).first()
        assert record is not None
        assert record.status == "published"
        assert record.title == "Stainless Steel Bottle"
        assert record.sku == "BOTTLE001"
        assert record.price == 24.99

    def test_publish_history(self, client, db_session):
        """Publish twice, GET history, verify 2 records."""
        tokens = _register(client)
        headers = _auth_header(tokens)

        client.post("/api/amazon/connect", params={"seller_id": "SELLER123"}, headers=headers)

        # Publish twice with different SKUs, sleep between to ensure distinct timestamps
        for sku in ["SKU001", "SKU002"]:
            if sku == "SKU002":
                time.sleep(1)
            resp = client.post(
                "/api/publish/create",
                params={
                    "title": f"Product {sku}",
                    "bullets": json.dumps(["Feature"]),
                    "description": "Desc",
                    "images": json.dumps(["https://example.com/img.jpg"]),
                    "sku": sku,
                    "price": 10.0,
                    "quantity": 5,
                    "category": "Toys",
                },
                headers=headers,
            )
            assert resp.status_code == 200

        # Check history
        resp = client.get("/api/publish/history", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["records"]) == 2
        assert data["records"][0]["sku"] == "SKU002"  # most recent first
        assert data["records"][1]["sku"] == "SKU001"

    def test_publish_history_filter(self, client, db_session):
        """Publish one, check history with status filter."""
        from app.models.publish_record import PublishRecord

        tokens = _register(client)
        headers = _auth_header(tokens)

        client.post("/api/amazon/connect", params={"seller_id": "SELLER123"}, headers=headers)

        # Publish once
        resp = client.post(
            "/api/publish/create",
            params={
                "title": "Filter Test Product",
                "bullets": json.dumps(["Feature"]),
                "description": "Desc",
                "images": json.dumps(["https://example.com/img.jpg"]),
                "sku": "FILTER001",
                "price": 15.0,
                "quantity": 3,
                "category": "Books",
            },
            headers=headers,
        )
        assert resp.status_code == 200

        # Also insert a "failed" record directly
        user_id = _get_user_id(client, tokens)
        failed_record = PublishRecord(
            user_id=user_id,
            status="failed",
            error_message="Test failure",
            sku="FAIL001",
        )
        db_session.add(failed_record)
        db_session.commit()

        # Filter by published
        resp = client.get("/api/publish/history", params={"status": "published"}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["records"][0]["sku"] == "FILTER001"

        # Filter by failed
        resp = client.get("/api/publish/history", params={"status": "failed"}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["records"][0]["sku"] == "FAIL001"

    def test_publish_history_pagination(self, client):
        """Publish 3, request limit=2, verify pagination."""
        tokens = _register(client)
        headers = _auth_header(tokens)

        client.post("/api/amazon/connect", params={"seller_id": "SELLER123"}, headers=headers)

        for i in range(3):
            if i > 0:
                time.sleep(1)
            resp = client.post(
                "/api/publish/create",
                params={
                    "title": f"Product {i}",
                    "bullets": json.dumps(["Feature"]),
                    "description": "Desc",
                    "images": json.dumps(["https://example.com/img.jpg"]),
                    "sku": f"PAG{i:03d}",
                    "price": 10.0,
                    "quantity": 5,
                    "category": "Toys",
                },
                headers=headers,
            )
            assert resp.status_code == 200

        # First page
        resp = client.get("/api/publish/history", params={"limit": 2}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["records"]) == 2
        assert data["total"] == 3

        # Second page
        resp = client.get("/api/publish/history", params={"limit": 2, "offset": 2}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["records"]) == 1
        assert data["total"] == 3


class TestUnauthorized:
    def test_amazon_connect_no_token(self, client):
        """POST /api/amazon/connect without token returns 403."""
        resp = client.post("/api/amazon/connect", params={"seller_id": "SELLER123"})
        assert resp.status_code == 403

    def test_amazon_status_no_token(self, client):
        """GET /api/amazon/status without token returns 403."""
        resp = client.get("/api/amazon/status")
        assert resp.status_code == 403

    def test_amazon_disconnect_no_token(self, client):
        """POST /api/amazon/disconnect without token returns 403."""
        resp = client.post("/api/amazon/disconnect")
        assert resp.status_code == 403

    def test_publish_create_no_token(self, client):
        """POST /api/publish/create without token returns 403."""
        resp = client.post("/api/publish/create")
        assert resp.status_code == 403

    def test_publish_history_no_token(self, client):
        """GET /api/publish/history without token returns 403."""
        resp = client.get("/api/publish/history")
        assert resp.status_code == 403

    def test_amazon_connect_invalid_token(self, client):
        """POST with invalid token returns 401."""
        headers = {"Authorization": "Bearer invalidtoken"}
        resp = client.post("/api/amazon/connect", params={"seller_id": "SELLER123"}, headers=headers)
        assert resp.status_code == 401

    def test_publish_create_invalid_token(self, client):
        """POST /api/publish/create with invalid token returns 401."""
        headers = {"Authorization": "Bearer invalidtoken"}
        resp = client.post("/api/publish/create", headers=headers)
        assert resp.status_code == 401

    def test_publish_history_invalid_token(self, client):
        """GET /api/publish/history with invalid token returns 401."""
        headers = {"Authorization": "Bearer invalidtoken"}
        resp = client.get("/api/publish/history", headers=headers)
        assert resp.status_code == 401
