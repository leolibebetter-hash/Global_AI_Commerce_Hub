# backend/app/schemas/market_research.py
"""Pydantic schemas for market research analysis endpoints."""
from datetime import datetime
from pydantic import BaseModel, Field


# ── AI Analysis Requests ───────────────────────────────

class TrendingAnalyzeRequest(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    market: str = Field(default="US", pattern=r"^(US|UK|DE|JP)$")
    platform: str = Field(default="amazon", pattern=r"^(amazon|ebay|tiktok_shop|all)$")
    language: str = Field(default="en", pattern=r"^(en|zh|de|ja)$")


class KeywordResearchRequest(BaseModel):
    product_category: str = Field(min_length=1, max_length=100)
    seed_keywords: list[str] = Field(default_factory=list, max_length=10)
    market: str = Field(default="US", pattern=r"^(US|UK|DE|JP)$")
    language: str = Field(default="en", pattern=r"^(en|zh|de|ja)$")


class CompetitorAnalyzeRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=200)
    product_features: list[str] = Field(default_factory=list, max_length=10)
    market: str = Field(default="US", pattern=r"^(US|UK|DE|JP)$")
    platform: str = Field(default="amazon", pattern=r"^(amazon|ebay|tiktok_shop|all)$")
    language: str = Field(default="en", pattern=r"^(en|zh|de|ja)$")


# ── Response Schemas ───────────────────────────────────

class ResearchResultResponse(BaseModel):
    id: str
    analysis_type: str
    title: str
    summary: str
    body: str
    structured_data: dict | None = None
    market: str
    platform: str
    credits_used: float
    created_at: datetime

    class Config:
        from_attributes = True


class TrendingAnalyzeResponse(BaseModel):
    result: ResearchResultResponse
    credits_used: float = 2.0


class KeywordResearchResponse(BaseModel):
    result: ResearchResultResponse
    credits_used: float = 1.5


class CompetitorAnalyzeResponse(BaseModel):
    result: ResearchResultResponse
    credits_used: float = 2.0


# ── List Response ──────────────────────────────────────

class ResearchResultListResponse(BaseModel):
    results: list[ResearchResultResponse]
    total: int
