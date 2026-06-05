from abc import ABC, abstractmethod
from app.core.config import settings
from PIL import Image
import uuid
from pathlib import Path

from app.services.storage import UPLOAD_DIR


STYLE_PROMPTS = {
    "minimal": "clean white background, studio lighting, minimalist product photography, no shadows",
    "lifestyle": "natural home setting, warm ambient lighting, cozy lifestyle scene, depth of field",
    "premium": "luxury dark backdrop, dramatic lighting, high-end commercial photography, reflective surface",
}


class SceneGenerator(ABC):
    @abstractmethod
    async def generate(self, image_url: str, style: str, count: int = 3) -> list[str]:
        """Generate scene images. Returns list of URLs."""


class MockSceneGenerator(SceneGenerator):
    async def generate(self, image_url: str, style: str, count: int = 3) -> list[str]:
        # Generate solid-color placeholder images
        style_colors = {
            "minimal": ("#F5F5F5", "简约"),
            "lifestyle": ("#FEF3C7", "生活化"),
            "premium": ("#1A1A1A", "高端"),
        }
        color, _ = style_colors.get(style, style_colors["minimal"])

        urls = []
        for i in range(count):
            img = Image.new("RGB", (1000, 1000), color)
            stored_name = f"scene_{uuid.uuid4().hex}.jpg"
            path = UPLOAD_DIR / stored_name
            img.save(path, "JPEG", quality=90)
            urls.append(f"/api/files/{stored_name}")
        return urls


class ReplicateSceneGenerator(SceneGenerator):
    async def generate(self, image_url: str, style: str, count: int = 3) -> list[str]:
        raise NotImplementedError("Replicate API not yet configured")


def get_scene_generator() -> SceneGenerator:
    if settings.scene_generator == "replicate":
        return ReplicateSceneGenerator()
    return MockSceneGenerator()
