# backend/tests/test_marketing.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

# In-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test_marketing.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Test user phone and token (valid for tests)
TEST_PHONE = "+8613800000001"
TEST_PASSWORD = "test123456"
TEST_TOKEN = None


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def get_auth_headers():
    """Get auth headers by registering a test user and getting a token."""
    global TEST_TOKEN
    if TEST_TOKEN:
        return {"Authorization": f"Bearer {TEST_TOKEN}"}

    # 1. Send SMS code
    resp = client.post("/api/auth/send-code", json={"phone": TEST_PHONE})
    if resp.status_code != 200:
        return {}
    code = resp.json()["code"]

    # 2. Register
    resp = client.post("/api/auth/register", json={
        "phone": TEST_PHONE,
        "password": TEST_PASSWORD,
        "code": code,
    })
    if resp.status_code == 201:
        data = resp.json()
        TEST_TOKEN = data.get("access_token")
    elif resp.status_code == 409:
        # Already exists, login
        resp = client.post("/api/auth/login", json={
            "phone": TEST_PHONE,
            "password": TEST_PASSWORD,
        })
        if resp.status_code == 200:
            data = resp.json()
            TEST_TOKEN = data.get("access_token")

    return {"Authorization": f"Bearer {TEST_TOKEN}"} if TEST_TOKEN else {}


class TestMarketingSkills:
    """Test the skill listing endpoint."""

    def test_list_skills(self):
        headers = get_auth_headers()
        resp = client.get("/api/marketing/skills", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "campaign_planner" in data
        assert "script_writer" in data
        assert "post_writer" in data
        assert "ad_copy_writer" in data
        assert "audience_analyzer" in data


class TestCampaignCRUD:
    """Test campaign create, read, update, delete."""

    def test_create_campaign(self):
        headers = get_auth_headers()
        resp = client.post("/api/marketing/campaigns", json={
            "name": "Test Summer Promo",
            "target_market": "US",
            "objective": "brand_awareness",
        }, headers=headers)
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["name"] == "Test Summer Promo"
        assert data["status"] == "draft"
        assert data["content_count"] == 0

    def test_list_campaigns(self):
        headers = get_auth_headers()
        resp = client.get("/api/marketing/campaigns", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "campaigns" in data
        assert "total" in data
        assert data["total"] >= 1

    def test_get_campaign(self):
        headers = get_auth_headers()
        list_resp = client.get("/api/marketing/campaigns", headers=headers)
        campaigns = list_resp.json()["campaigns"]
        if campaigns:
            campaign_id = campaigns[0]["id"]
            resp = client.get(f"/api/marketing/campaigns/{campaign_id}", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert "contents" in data

    def test_update_campaign(self):
        headers = get_auth_headers()
        list_resp = client.get("/api/marketing/campaigns", headers=headers)
        campaigns = list_resp.json()["campaigns"]
        if campaigns:
            campaign_id = campaigns[0]["id"]
            resp = client.put(f"/api/marketing/campaigns/{campaign_id}", json={
                "status": "active",
            }, headers=headers)
            assert resp.status_code == 200
            assert resp.json()["status"] == "active"

    def test_delete_campaign(self):
        headers = get_auth_headers()
        resp = client.post("/api/marketing/campaigns", json={
            "name": "To Delete",
        }, headers=headers)
        campaign_id = resp.json()["id"]

        resp = client.delete(f"/api/marketing/campaigns/{campaign_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "deleted"


class TestContentCRUD:
    """Test content listing and deletion."""

    def test_list_contents(self):
        headers = get_auth_headers()
        resp = client.get("/api/marketing/contents", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "contents" in data
        assert "total" in data

    def test_filter_contents_by_type(self):
        headers = get_auth_headers()
        resp = client.get("/api/marketing/contents?content_type=campaign_plan", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        for c in data["contents"]:
            assert c["content_type"] == "campaign_plan"


class TestAuthRequired:
    """Test that endpoints require auth."""

    def test_campaigns_require_auth(self):
        resp = client.get("/api/marketing/campaigns")
        assert resp.status_code == 403

    def test_contents_require_auth(self):
        resp = client.get("/api/marketing/contents")
        assert resp.status_code == 403

    def test_generate_requires_auth(self):
        resp = client.post("/api/marketing/generate-campaign", json={
            "product_name": "Test",
            "product_category": "Test",
        })
        assert resp.status_code == 403
