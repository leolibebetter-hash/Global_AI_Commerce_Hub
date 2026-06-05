"""Image processing tasks for Celery, plus synchronous helpers for dev/test."""

import asyncio
import concurrent.futures

from app.core.celery import celery_app
from app.services.background import get_background_remover
from app.services.image_gen import get_scene_generator


# ---------------------------------------------------------------------------
# Async helpers (run sync-in-a-thread friendly)
# ---------------------------------------------------------------------------


def _run_async(coro):
    """Run a coroutine synchronously, even if there's already a running loop."""
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        # No running event loop in this thread — use asyncio.run() directly
        return asyncio.run(coro)
    else:
        # A loop is already running (e.g., inside TestClient or an async handler).
        # Run the coroutine in a separate thread with its own event loop.
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(asyncio.run, coro)
            return future.result()


def process_image_sync(user_id: str, image_url: str, style: str) -> dict:
    """Synchronous image pipeline — no Celery dependency.

    Can be called directly from the API (dev/test) or from a Celery task.
    """
    try:
        # Step 1: Remove background
        remover = get_background_remover()
        no_bg_url = _run_async(remover.remove(image_url))

        # Step 2: Generate scene images
        generator = get_scene_generator()
        scene_urls = _run_async(generator.generate(no_bg_url, style, count=3))

        return {
            "status": "done",
            "no_bg_url": no_bg_url,
            "scene_urls": scene_urls,
        }
    except Exception as e:
        return {"status": "failed", "error": str(e)}


def regenerate_scene_sync(image_url: str, style: str) -> dict:
    """Synchronous scene regeneration — no Celery dependency."""
    try:
        generator = get_scene_generator()
        urls = _run_async(generator.generate(image_url, style, count=1))
        return {"status": "done", "url": urls[0] if urls else None}
    except Exception as e:
        return {"status": "failed", "error": str(e)}


# ---------------------------------------------------------------------------
# Celery tasks (delegate to sync helpers)
# ---------------------------------------------------------------------------


@celery_app.task(bind=True)
def process_image_pipeline(self, user_id: str, image_url: str, style: str):
    """Full pipeline: remove background -> generate scenes (via Celery)."""
    try:
        self.update_state(state="PROCESSING", meta={"stage": "remove_bg"})
        result = process_image_sync(user_id, image_url, style)
        if result["status"] == "done":
            self.update_state(
                state="PROCESSING",
                meta={"stage": "generate_scenes", **result},
            )
        return result
    except Exception as e:
        return {"status": "failed", "error": str(e)}


@celery_app.task(bind=True)
def regenerate_scene(self, image_url: str, style: str):
    """Regenerate a single scene image (via Celery)."""
    try:
        self.update_state(state="PROCESSING", meta={"stage": "generate"})
        result = regenerate_scene_sync(image_url, style)
        return result
    except Exception as e:
        return {"status": "failed", "error": str(e)}
