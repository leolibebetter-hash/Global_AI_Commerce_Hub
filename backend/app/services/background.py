from abc import ABC, abstractmethod
from app.core.config import settings


class BackgroundRemover(ABC):
    @abstractmethod
    async def remove(self, image_url: str) -> str:
        """Remove background, return URL of transparent PNG."""


class MockBackgroundRemover(BackgroundRemover):
    async def remove(self, image_url: str) -> str:
        # Return the original image URL as-is (mock)
        return image_url


class RemoveBgRemover(BackgroundRemover):
    async def remove(self, image_url: str) -> str:
        # TODO: Call remove.bg API
        raise NotImplementedError("remove.bg API not yet configured")


def get_background_remover() -> BackgroundRemover:
    if settings.background_remover == "removebg":
        return RemoveBgRemover()
    return MockBackgroundRemover()
