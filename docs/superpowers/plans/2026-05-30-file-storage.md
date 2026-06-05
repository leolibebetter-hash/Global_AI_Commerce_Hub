# File Storage — Implementation Plan

> **Goal:** File upload API with local storage for dev, swappable to AWS S3 in production.

**Architecture:** Storage backend abstraction. `LocalStorage` for dev (saves to `backend/uploads/`), `S3Storage` for production. Both implement the same interface. Config switch via env var `STORAGE_BACKEND=local|s3`. Upload endpoint validates file type (JPEG/PNG) and size (≤10MB). Returns a URL for retrieval.

**Tech Stack:** FastAPI UploadFile, python-multipart (already in requirements), boto3 (added for S3)

---

## Task 1: Storage Backend — `backend/app/services/storage.py`

Interface with two implementations:
- `LocalStorage`: saves to `uploads/`, serves via `/api/files/{filename}`
- `S3Storage`: uploads to S3 bucket, returns CloudFront/presigned URL

Factory function `get_storage()` returns the configured backend.

## Task 2: Upload API — `backend/app/api/files.py`

- `POST /api/files/upload` — accepts multipart file, validates, stores, returns URL
- `GET /api/files/{filename}` — serves local files (dev only)

## Task 3: Register Router + Static Mount

Update `main.py` to include files router and mount static directory.

## Task 4: Tests
