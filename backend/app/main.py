from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.amazon_auth import router as amazon_auth_router
from app.api.auth import router as auth_router
from app.api.copy_factory import router as copy_factory_router
from app.api.files import router as files_router
from app.api.image_factory import router as image_factory_router
from app.api.marketing import router as marketing_router
from app.api.market_research import router as market_research_router
from app.api.publish import router as publish_router
from app.api.usage import router as usage_router
from app.core.config import settings
from app.core.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.is_jwt_secret_default():
        import sys
        print(
            "WARNING: JWT_SECRET_KEY is using the default value. "
            "Set it in .env before deployment.",
            file=sys.stderr,
        )
    # Auto-create tables for local development (SQLite)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        print(f"WARNING: Database health check failed: {exc}", file=sys.stderr)
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

app.include_router(amazon_auth_router, prefix="/api/amazon", tags=["amazon"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(copy_factory_router, prefix="/api/copy-factory", tags=["copy-factory"])
app.include_router(files_router, prefix="/api/files", tags=["files"])
app.include_router(image_factory_router, prefix="/api/image-factory", tags=["image-factory"])
app.include_router(marketing_router, prefix="/api/marketing", tags=["marketing"])
app.include_router(market_research_router, prefix="/api/market-research", tags=["market-research"])
app.include_router(publish_router, prefix="/api/publish", tags=["publish"])
app.include_router(usage_router, prefix="/api/usage", tags=["usage"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
