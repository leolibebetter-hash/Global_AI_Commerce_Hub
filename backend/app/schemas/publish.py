"""Pydantic schemas for multi-platform publishing."""
from datetime import datetime
from pydantic import BaseModel, Field


PLATFORMS = ["amazon", "ebay", "shopify", "tiktok"]


# ── Platform Account ──────────────────────────────────

class PlatformAccountConnect(BaseModel):
    platform: str = Field(min_length=1, max_length=20, pattern=r"^(amazon|ebay|shopify|tiktok)$")
    seller_id: str = Field(min_length=1, max_length=100)
    access_token: str = Field(min_length=1)
    refresh_token: str | None = None
    marketplace_id: str | None = None
    store_name: str = Field(min_length=1, max_length=100)
    extra_data: dict | None = None


class PlatformAccountResponse(BaseModel):
    id: str
    platform: str
    seller_id: str
    marketplace_id: str | None = None
    store_name: str
    is_active: bool
    extra_data: dict | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class PlatformAccountListResponse(BaseModel):
    accounts: list[PlatformAccountResponse]
    total: int


# ── Publish ───────────────────────────────────────────

class PublishListingRequest(BaseModel):
    platform: str = Field(pattern=r"^(amazon|ebay|shopify|tiktok)$")
    title: str = Field(min_length=1, max_length=300)
    bullets: list[str] = Field(default_factory=list, max_length=10)
    description: str = Field(min_length=1)
    images: list[str] = Field(default_factory=list, max_length=10)
    sku: str = Field(min_length=1, max_length=100)
    price: float = Field(gt=0)
    quantity: int = Field(ge=0)
    category: str = Field(min_length=1, max_length=100)


class PublishRecordResponse(BaseModel):
    id: str
    platform: str
    listing_id: str | None = None
    asin: str | None = None
    status: str
    title: str | None = None
    sku: str | None = None
    price: float | None = None
    error_message: str | None = None
    seller_central_url: str | None = None
    created_at: datetime | None = None


class PublishHistoryResponse(BaseModel):
    records: list[PublishRecordResponse]
    total: int
    limit: int
    offset: int


class PublishCreateResponse(BaseModel):
    status: str
    platform: str
    listing_id: str | None = None
    asin: str | None = None
    seller_central_url: str | None = None
    record_id: str
    error: str | None = None
