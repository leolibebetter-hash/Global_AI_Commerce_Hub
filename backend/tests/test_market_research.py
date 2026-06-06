import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test_market_research.db"
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
TEST_TOKEN = None


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def get_auth_headers():
    global TEST_TOKEN
    if TEST_TOKEN:
        return {"Authorization": f"Bearer {TEST_TOKEN}"}

    # Step 1: Send an SMS code so it's stored (in-memory fallback in sms.py)
    send_resp = client.post("/api/auth/send-code", json={"phone": "+8613800000010"})
    assert send_resp.status_code == 200
    code = send_resp.json().get("code")
    assert code is not None

    # Step 2: Register with the real code returned by send-code
    resp = client.post("/api/auth/register", json={
        "phone": "+8613800000010",
        "password": "test123456",
        "code": code,
    })
    if resp.status_code == 201:
        data = resp.json()
        TEST_TOKEN = data.get("access_token")
    elif resp.status_code == 409:
        # User already exists; send a fresh code and log in
        send_resp = client.post("/api/auth/send-code", json={"phone": "+8613800000010"})
        assert send_resp.status_code == 200
        resp = client.post("/api/auth/login", json={
            "phone": "+8613800000010",
            "password": "test123456",
        })
        if resp.status_code == 200:
            data = resp.json()
            TEST_TOKEN = data.get("access_token")

    return {"Authorization": f"Bearer {TEST_TOKEN}"} if TEST_TOKEN else {}


class TestMarketResearchSkills:
    def test_list_skills(self):
        headers = get_auth_headers()
        resp = client.get("/api/market-research/skills", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "trending_analyzer" in data
        assert "keyword_researcher" in data
        assert "competitor_analyzer" in data


class TestResultsCRUD:
    def test_list_results_empty(self):
        headers = get_auth_headers()
        resp = client.get("/api/market-research/results", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data
        assert "total" in data

    def test_filter_results_by_type(self):
        headers = get_auth_headers()
        resp = client.get("/api/market-research/results?analysis_type=trending", headers=headers)
        assert resp.status_code == 200


class TestAuthRequired:
    def test_analyze_requires_auth(self):
        resp = client.post("/api/market-research/analyze-trending", json={
            "category": "Electronics",
            "market": "US",
        })
        assert resp.status_code == 403

    def test_results_require_auth(self):
        resp = client.get("/api/market-research/results")
        assert resp.status_code == 403
