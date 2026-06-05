import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from celery.result import AsyncResult

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.services.storage import UPLOAD_DIR
from app.services.usage import deduct_credits
from app.tasks.image_tasks import (
    process_image_pipeline,
    process_image_sync,
    regenerate_scene,
    regenerate_scene_sync,
)

router = APIRouter()

ALLOWED_STYLES = {"minimal", "lifestyle", "premium"}


@router.post("/process")
async def process_image(
    file: UploadFile = File(...),
    style: str = Form("minimal"),
    current_user: User = Depends(get_current_user),
):
    """Upload image and start the remove-bg + scene generation pipeline."""
    # Validate file type
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(400, "Only JPEG and PNG images are allowed")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File size must not exceed 10MB")

    # Validate style
    if style not in ALLOWED_STYLES:
        raise HTTPException(400, "Style must be: minimal, lifestyle, or premium")

    # Save uploaded file
    ext = Path(file.filename or "image.png").suffix
    stored_name = f"upload_{uuid.uuid4().hex}{ext}"
    path = UPLOAD_DIR / stored_name
    path.write_bytes(content)
    image_url = f"/api/files/{stored_name}"

    if settings.image_processing_async:
        # Dispatch Celery task
        task = process_image_pipeline.delay(current_user.id, image_url, style)
        return {
            "task_id": task.id,
            "status": "processing",
            "image_url": image_url,
        }
    else:
        # Sync for dev/test — mock is instant, no worker needed
        result = process_image_sync(current_user.id, image_url, style)
        return {
            "task_id": "sync",
            "status": "done",
            "image_url": image_url,
            **result,
        }


@router.get("/result/{task_id}")
async def get_result(task_id: str):
    """Poll Celery task status and get results."""
    try:
        result = AsyncResult(task_id, app=process_image_pipeline.app)
        if result.failed():
            return {"status": "failed", "error": str(result.result)}
        if result.successful():
            return result.result
        state = result.state or "PENDING"
        info = result.info or {}
        return {"status": state.lower(), **info}
    except Exception:
        # Redis not available or Celery not configured (sync mode)
        return {"status": "failed", "error": "Result backend not available"}


@router.post("/regenerate")
async def regenerate(
    image_url: str = Form(...),
    style: str = Form("minimal"),
    current_user: User = Depends(get_current_user),
):
    """Regenerate a single scene image."""
    if style not in ALLOWED_STYLES:
        raise HTTPException(400, "Invalid style")

    if settings.image_processing_async:
        task = regenerate_scene.delay(image_url, style)
        return {"task_id": task.id, "status": "processing"}
    else:
        result = regenerate_scene_sync(image_url, style)
        return {"task_id": "sync", "status": "done", **result}


@router.post("/confirm")
async def confirm_images(
    count: int = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Confirm generated images and deduct credits."""
    try:
        deduct_credits(
            db,
            current_user.id,
            "image_gen",
            credits_used=float(count),
            api_cost=count * 0.04,
        )
        db.commit()
        return {"status": "ok", "credits_deducted": count}
    except ValueError as e:
        raise HTTPException(402, str(e))
