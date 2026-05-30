from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from app.services.storage import get_storage, UPLOAD_DIR

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG and PNG images are allowed")
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File size must not exceed 10MB")
    storage = get_storage()
    url = await storage.upload(file.filename or "image.png", content, file.content_type)
    return {"url": url, "filename": file.filename, "size": len(content)}


@router.get("/{filename}")
async def get_file(filename: str):
    path = UPLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(404, "File not found")
    return FileResponse(path)
