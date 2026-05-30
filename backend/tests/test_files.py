import io
import os

import pytest
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.services.storage import UPLOAD_DIR

client = TestClient(app)


def make_jpeg(size: tuple[int, int] = (100, 100)) -> bytes:
    img = Image.new("RGB", size, color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_upload_jpeg():
    content = make_jpeg()
    response = client.post(
        "/api/files/upload",
        files={"file": ("test.jpg", content, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["url"].startswith("/api/files/")
    assert data["filename"] == "test.jpg"
    assert data["size"] == len(content)


def test_upload_invalid_type():
    response = client.post(
        "/api/files/upload",
        files={"file": ("test.txt", b"hello world", "text/plain")},
    )
    assert response.status_code == 400
    assert "JPEG and PNG" in response.json()["detail"]


def test_upload_too_large():
    # Create content larger than 10MB
    large_content = b"x" * (11 * 1024 * 1024)
    response = client.post(
        "/api/files/upload",
        files={"file": ("large.jpg", large_content, "image/jpeg")},
    )
    assert response.status_code == 400
    assert "10MB" in response.json()["detail"]


def test_get_file():
    content = make_jpeg()
    upload_resp = client.post(
        "/api/files/upload",
        files={"file": ("test.jpg", content, "image/jpeg")},
    )
    assert upload_resp.status_code == 200
    url = upload_resp.json()["url"]

    # Strip the prefix to get the filename
    filename = url.rsplit("/", 1)[-1]
    response = client.get(f"/api/files/{filename}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/jpeg"
    assert len(response.content) == len(content)


def test_get_nonexistent_file():
    response = client.get("/api/files/nonexistent.jpg")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.fixture(autouse=True)
def cleanup_uploads():
    """Remove any uploaded files created during tests."""
    yield
    for f in UPLOAD_DIR.iterdir():
        if f.is_file() and f.name != ".gitkeep":
            f.unlink()
