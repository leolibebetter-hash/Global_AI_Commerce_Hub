from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.auth import router as auth_router
from app.api.copy_factory import router as copy_factory_router
from app.api.files import router as files_router
from app.api.image_factory import router as image_factory_router
from app.api.usage import router as usage_router
from app.core.config import settings
from app.core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.is_jwt_secret_default():
        import sys
        print(
            "WARNING: JWT_SECRET_KEY is using the default value. "
            "Set it in .env before deployment.",
            file=sys.stderr,
        )
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        pass
    yield


app = FastAPI(
    title="Global AI Commerce Hub",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(copy_factory_router, prefix="/api/copy-factory", tags=["copy-factory"])
app.include_router(files_router, prefix="/api/files", tags=["files"])
app.include_router(image_factory_router, prefix="/api/image-factory", tags=["image-factory"])
app.include_router(usage_router, prefix="/api/usage", tags=["usage"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
