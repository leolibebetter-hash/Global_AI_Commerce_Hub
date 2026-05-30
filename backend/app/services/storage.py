import uuid
from abc import ABC, abstractmethod
from pathlib import Path

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


class StorageBackend(ABC):
    @abstractmethod
    async def upload(self, filename: str, content: bytes, content_type: str) -> str:
        """Upload file, return URL."""

    @abstractmethod
    async def delete(self, url: str) -> None:
        """Delete file by URL."""


class LocalStorage(StorageBackend):
    async def upload(self, filename: str, content: bytes, content_type: str) -> str:
        ext = Path(filename).suffix
        stored_name = f"{uuid.uuid4().hex}{ext}"
        path = UPLOAD_DIR / stored_name
        path.write_bytes(content)
        return f"/api/files/{stored_name}"

    async def delete(self, url: str) -> None:
        stored_name = url.rsplit("/", 1)[-1]
        path = UPLOAD_DIR / stored_name
        if path.exists():
            path.unlink()


def get_storage() -> StorageBackend:
    from app.core.config import settings

    if settings.storage_backend == "s3":
        raise NotImplementedError("S3 storage not yet implemented")
    return LocalStorage()
