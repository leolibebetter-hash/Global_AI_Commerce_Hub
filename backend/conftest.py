"""Pytest fixtures for the entire backend."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

# ---------------------------------------------------------------------------
# In-memory SQLite database for tests
# ---------------------------------------------------------------------------
_test_engine = create_engine("sqlite:///:memory:", echo=False)
_test_session_factory = sessionmaker(
    autocommit=False, autoflush=False, bind=_test_engine
)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables once per test session."""
    Base.metadata.create_all(bind=_test_engine)
    yield
    Base.metadata.drop_all(bind=_test_engine)


@pytest.fixture
def db():
    """Provide a clean transactional scope per test."""
    connection = _test_engine.connect()
    transaction = connection.begin()
    session = _test_session_factory(bind=connection)

    # Override the dependency
    app.dependency_overrides[get_db] = lambda: session

    yield session

    session.close()
    transaction.rollback()
    connection.close()

    # Clean up overrides
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def client(db):
    """FastAPI TestClient with a clean database per test."""
    with TestClient(app) as c:
        yield c
