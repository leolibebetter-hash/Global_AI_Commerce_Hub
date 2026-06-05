# Phase 1: Image Factory — Implementation Plan

> **Goal:** Upload white-background image → remove background → AI scene generation (3 styles) → preview → download/use in listing.

**Key architecture decision:** Image generation is async (10-30s). Use Celery + Redis for task queue. Frontend polls task status. Background removal and scene generation have mock implementations for dev, swappable to real APIs with config change.

**External APIs needed (not yet registered):** remove.bg, Replicate/Stability AI. Both use mock backends for now.

---

## Sub-Phase 1.1: Celery Async Task Setup

- `backend/app/core/celery.py` — Celery app config with Redis broker
- `backend/app/tasks/` — task modules
- Task status model or Redis-based status tracking
- `GET /api/tasks/{task_id}/status` — polling endpoint

## Sub-Phase 1.2: Background Removal Service

- `backend/app/services/background.py` — `BackgroundRemover` abstraction
- `MockBackgroundRemover` — returns a solid-color placeholder (dev)
- `RemoveBgRemover` — calls remove.bg API (production)
- Task: `remove_background(image_url) -> result_url`
- Usage deduction on success (¥0.5/次 from PRD)

## Sub-Phase 1.3: AI Scene Generation Service

- `backend/app/services/image_gen.py` — `SceneGenerator` abstraction
- `MockSceneGenerator` — returns colored placeholder images (dev)
- `ReplicateSceneGenerator` — calls Replicate SDXL/Flux API (production)
- Prompt builder from product context + style choice
- Task: `generate_scenes(image_url, style, count=3) -> [url1, url2, url3]`
- Post-processing: resize to 2000×2000 (Pillow)
- Usage deduction on success (¥2.0/张 from PRD)

## Sub-Phase 1.4: Image Factory API

- `POST /api/image-factory/upload-and-process` — upload → remove bg → generate scenes (async)
- `GET /api/image-factory/result/{task_id}` — get generation results
- `POST /api/image-factory/regenerate` — regenerate single image with new style
- `POST /api/image-factory/confirm` — confirm selected images, deduct credits

## Sub-Phase 1.5: Image Factory UI

- Upload zone with drag-and-drop + preview
- Style selector: 简约 / 生活化 / 高端 (US-002)
- Generation progress with skeleton loading
- Results gallery: 3 scene variants side-by-side
- Image zoom on hover, selection checkboxes
- Download buttons (single + batch ZIP)
- "Use in listing" action

## Sub-Phase 1.6: Integration & Polish

- Wire up usage deduction
- Loading states, error states, empty states
- Responsive gallery
- Tests for all services and API endpoints
