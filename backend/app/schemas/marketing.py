from datetime import datetime
from pydantic import BaseModel, Field


# ── Enums ──────────────────────────────────────────────

CONTENT_TYPES = ["campaign_plan", "video_script", "social_post", "ad_copy", "audience_profile"]
PLATFORMS = ["tiktok", "youtube_shorts", "instagram_reels", "instagram", "facebook", "twitter", "pinterest", "google_ads", "bing_ads"]
OBJECTIVES = ["brand_awareness", "conversion", "engagement", "traffic"]
STATUSES = ["draft", "active", "completed"]
MARKETS = ["US", "UK", "DE", "JP"]
LANGUAGES = ["en", "zh", "de", "ja"]


# ── AI Generation Requests ─────────────────────────────

class CampaignGenerateRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=200)
    product_category: str = Field(min_length=1, max_length=100)
    product_features: list[str] = Field(default_factory=list, max_length=10)
    target_market: str = Field(default="US", pattern=r"^(US|UK|DE|JP)$")
    language: str = Field(default="en", pattern=r"^(en|zh|de|ja)$")
    objective: str = Field(default="brand_awareness")


class ScriptGenerateRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=200)
    product_features: list[str] = Field(default_factory=list, max_length=10)
    target_audience: str = Field(default="general", min_length=1, max_length=200)
    platform: str = Field(default="tiktok", pattern=r"^(tiktok|youtube_shorts|instagram_reels)$")
    language: str = Field(default="en", pattern=r"^(en|zh|de|ja)$")
    tone: str = Field(default="energetic", min_length=1, max_length=50)
    duration_seconds: int = Field(default=30, ge=15, le=180)


class PostGenerateRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=200)
    product_features: list[str] = Field(default_factory=list, max_length=10)
    platform: str = Field(default="instagram", pattern=r"^(instagram|facebook|twitter|pinterest)$")
    language: str = Field(default="en", pattern=r"^(en|zh|de|ja)$")
    tone: str = Field(default="professional", min_length=1, max_length=50)
    key_message: str = Field(default="", max_length=300)


class AdCopyGenerateRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=200)
    product_features: list[str] = Field(default_factory=list, max_length=10)
    target_market: str = Field(default="US", pattern=r"^(US|UK|DE|JP)$")
    platform: str = Field(default="google_ads", pattern=r"^(google_ads|bing_ads)$")
    language: str = Field(default="en", pattern=r"^(en|zh|de|ja)$")
    objective: str = Field(default="conversion")


class AudienceProfileRequest(BaseModel):
    product_category: str = Field(min_length=1, max_length=100)
    target_market: str = Field(default="US", pattern=r"^(US|UK|DE|JP)$")
    interests: list[str] = Field(default_factory=list, max_length=10)
    language: str = Field(default="en", pattern=r"^(en|zh|de|ja)$")


# ── AI Generation Responses ────────────────────────────

class CampaignPlanResponse(BaseModel):
    theme: str
    description: str
    content_strategy: str
    channel_recommendations: list[dict]
    hashtags: list[str]
    estimated_budget_tier: str


class VideoScriptResponse(BaseModel):
    title: str
    hook: str
    scenes: list[dict]
    music_suggestion: str
    cta: str
    total_duration_seconds: int


class SocialPostResponse(BaseModel):
    caption: str
    hashtags: list[str]
    image_description: str
    best_posting_time: str
    engagement_tips: str


class AdCopyResponse(BaseModel):
    headlines: list[str]
    descriptions: list[str]
    cta: str
    keywords: list[dict]
    sitelink_suggestions: list[str]


class AudienceProfileResponse(BaseModel):
    demographics: dict
    interests_behaviors: list[str]
    content_preferences: list[str]
    platform_usage: dict
    pain_points: list[str]
    purchase_motivations: list[str]


class CampaignGenerateResponse(BaseModel):
    plan: CampaignPlanResponse
    credits_used: float = 1.0


class ScriptGenerateResponse(BaseModel):
    script: VideoScriptResponse
    credits_used: float = 1.0


class PostGenerateResponse(BaseModel):
    post: SocialPostResponse
    credits_used: float = 0.5


class AdCopyGenerateResponse(BaseModel):
    ad_copy: AdCopyResponse
    credits_used: float = 1.0


class AudienceProfileGenerateResponse(BaseModel):
    profile: AudienceProfileResponse
    credits_used: float = 1.5


# ── Campaign CRUD Schemas ──────────────────────────────

class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    target_market: str = Field(default="US")
    target_audience: str | None = None
    objective: str = Field(default="brand_awareness")


class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    description: str | None = None
    target_audience: str | None = None
    objective: str | None = None
    status: str | None = None


class CampaignResponse(BaseModel):
    id: str
    name: str
    description: str | None
    target_market: str
    target_audience: str | None
    objective: str
    status: str
    created_at: datetime
    updated_at: datetime
    content_count: int = 0

    class Config:
        from_attributes = True


class CampaignDetailResponse(BaseModel):
    id: str
    name: str
    description: str | None
    target_market: str
    target_audience: str | None
    objective: str
    status: str
    created_at: datetime
    updated_at: datetime
    content_count: int = 0
    contents: list["ContentResponse"] = []

    class Config:
        from_attributes = True


# ── Content CRUD Schemas ───────────────────────────────

class ContentResponse(BaseModel):
    id: str
    campaign_id: str | None
    content_type: str
    title: str
    body: str
    platform: str
    language: str
    metadata_: dict | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContentLinkRequest(BaseModel):
    campaign_id: str = Field(min_length=1)


# ── List Response ──────────────────────────────────────

class CampaignListResponse(BaseModel):
    campaigns: list[CampaignResponse]
    total: int


class ContentListResponse(BaseModel):
    contents: list[ContentResponse]
    total: int
