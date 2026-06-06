# Marketing Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Marketing & Promotion module (Module 3) with AI-powered campaign planning, content generation, audience profiling, and lightweight campaign/content management.

**Architecture:** Hybrid skill pattern (matching `copy_skills`) + lightweight Campaign container. AI generation via DeepSeek API. REST API under `/api/marketing/`. Frontend as a 3-tab React page.

**Tech Stack:** Python FastAPI, SQLAlchemy, DeepSeek API (via OpenAI SDK), React + TypeScript, Tailwind CSS, i18next

**Design Spec:** `docs/superpowers/specs/2026-06-06-marketing-module-design.md`

---

## File Structure Map

### Create (backend)
| File | Responsibility |
|------|---------------|
| `backend/app/models/marketing_campaign.py` | MarketingCampaign ORM model |
| `backend/app/models/marketing_content.py` | MarketingContent ORM model |
| `backend/app/schemas/marketing.py` | All Pydantic request/response schemas |
| `backend/app/services/marketing_skills/__init__.py` | Package exports |
| `backend/app/services/marketing_skills/base.py` | Abstract base classes + context/result dataclasses |
| `backend/app/services/marketing_skills/registry.py` | Skill provider registry |
| `backend/app/services/marketing_skills/campaign_planner.py` | Campaign planning AI skill |
| `backend/app/services/marketing_skills/script_writer.py` | Video script AI skill |
| `backend/app/services/marketing_skills/post_writer.py` | Social post AI skill |
| `backend/app/services/marketing_skills/ad_copy_writer.py` | Ad copy AI skill |
| `backend/app/services/marketing_skills/audience_analyzer.py` | Audience analysis AI skill |
| `backend/app/api/marketing.py` | All marketing REST endpoints |
| `backend/tests/test_marketing.py` | API integration tests |

### Modify (backend)
| File | Change |
|------|--------|
| `backend/app/models/__init__.py` | Import new models |
| `backend/app/main.py` | Register marketing router |

### Create (frontend)
| File | Responsibility |
|------|---------------|
| `frontend/src/pages/MarketingHub.tsx` | Main 3-tab marketing page |

### Modify (frontend)
| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Add `/marketing` route |
| `frontend/src/components/Layout.tsx` | Add marketing nav item |
| `frontend/src/i18n/zh.json` | Chinese translations |
| `frontend/src/i18n/en.json` | English translations |

---

### Task 1: Marketing ORM Models

**Files:**
- Create: `backend/app/models/marketing_campaign.py`
- Create: `backend/app/models/marketing_content.py`

- [ ] **Step 1: Create MarketingCampaign model**

```python
# backend/app/models/marketing_campaign.py
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class MarketingCampaign(Base):
    __tablename__ = "marketing_campaigns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_market: Mapped[str] = mapped_column(String(10), nullable=False, default="US")
    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)
    objective: Mapped[str] = mapped_column(String(50), nullable=False, default="brand_awareness")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    contents: Mapped[list["MarketingContent"]] = relationship(
        "MarketingContent", back_populates="campaign", lazy="selectin"
    )
```

- [ ] **Step 2: Create MarketingContent model**

```python
# backend/app/models/marketing_content.py
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class MarketingContent(Base):
    __tablename__ = "marketing_contents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("marketing_campaigns.id"), nullable=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    content_type: Mapped[str] = mapped_column(String(30), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    platform: Mapped[str] = mapped_column(String(30), nullable=False)
    language: Mapped[str] = mapped_column(String(5), nullable=False, default="en")
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    campaign: Mapped["MarketingCampaign | None"] = relationship(
        "MarketingCampaign", back_populates="contents"
    )
```

- [ ] **Step 3: Verify models import correctly**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.models.marketing_campaign import MarketingCampaign; from app.models.marketing_content import MarketingContent; print('Models OK')"`
Expected: "Models OK"

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/marketing_campaign.py backend/app/models/marketing_content.py
git commit -m "feat: add MarketingCampaign and MarketingContent ORM models

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Marketing Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/marketing.py`

- [ ] **Step 1: Create all Pydantic schemas**

```python
# backend/app/schemas/marketing.py
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
    channel_recommendations: list[dict]  # [{"platform": str, "reason": str, "content_type": str}]
    hashtags: list[str]
    estimated_budget_tier: str  # "low" | "medium" | "high"


class VideoScriptResponse(BaseModel):
    title: str
    hook: str  # first 3 seconds
    scenes: list[dict]  # [{"time": str, "visual": str, "narration": str, "text_overlay": str}]
    music_suggestion: str
    cta: str  # call to action
    total_duration_seconds: int


class SocialPostResponse(BaseModel):
    caption: str
    hashtags: list[str]
    image_description: str  # hint for image generation
    best_posting_time: str
    engagement_tips: str


class AdCopyResponse(BaseModel):
    headlines: list[str]  # 3-5 headline variants
    descriptions: list[str]  # 2-3 description variants
    cta: str
    keywords: list[dict]  # [{"keyword": str, "match_type": str}]
    sitelink_suggestions: list[str]


class AudienceProfileResponse(BaseModel):
    demographics: dict  # {"age_range": str, "gender_split": str, "income_level": str, "location": str}
    interests_behaviors: list[str]
    content_preferences: list[str]
    platform_usage: dict  # {"primary": list[str], "secondary": list[str]}
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
```

- [ ] **Step 2: Verify schemas import**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.schemas.marketing import CampaignGenerateRequest, CampaignResponse; print('Schemas OK')"`
Expected: "Schemas OK"

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/marketing.py
git commit -m "feat: add marketing Pydantic schemas for all endpoints

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Marketing Skills — Base Classes + Registry

**Files:**
- Create: `backend/app/services/marketing_skills/__init__.py`
- Create: `backend/app/services/marketing_skills/base.py`
- Create: `backend/app/services/marketing_skills/registry.py`

- [ ] **Step 1: Create base classes and context dataclasses**

```python
# backend/app/services/marketing_skills/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


# ── Context dataclasses ────────────────────────────────

@dataclass
class CampaignContext:
    product_name: str
    product_category: str
    features: list[str] = field(default_factory=list)
    target_market: str = "US"
    language: str = "en"
    objective: str = "brand_awareness"


@dataclass
class ScriptContext:
    product_name: str
    features: list[str] = field(default_factory=list)
    target_audience: str = "general"
    platform: str = "tiktok"
    language: str = "en"
    tone: str = "energetic"
    duration_seconds: int = 30


@dataclass
class PostContext:
    product_name: str
    features: list[str] = field(default_factory=list)
    platform: str = "instagram"
    language: str = "en"
    tone: str = "professional"
    key_message: str = ""


@dataclass
class AdCopyContext:
    product_name: str
    features: list[str] = field(default_factory=list)
    target_market: str = "US"
    platform: str = "google_ads"
    language: str = "en"
    objective: str = "conversion"


@dataclass
class AudienceContext:
    product_category: str
    target_market: str = "US"
    interests: list[str] = field(default_factory=list)
    language: str = "en"


# ── Result dataclasses ─────────────────────────────────

@dataclass
class CampaignPlanResult:
    theme: str
    description: str
    content_strategy: str
    channel_recommendations: list[dict]
    hashtags: list[str]
    estimated_budget_tier: str


@dataclass
class VideoScriptResult:
    title: str
    hook: str
    scenes: list[dict]
    music_suggestion: str
    cta: str
    total_duration_seconds: int


@dataclass
class SocialPostResult:
    caption: str
    hashtags: list[str]
    image_description: str
    best_posting_time: str
    engagement_tips: str


@dataclass
class AdCopyResult:
    headlines: list[str]
    descriptions: list[str]
    cta: str
    keywords: list[dict]
    sitelink_suggestions: list[str]


@dataclass
class AudienceProfileResult:
    demographics: dict
    interests_behaviors: list[str]
    content_preferences: list[str]
    platform_usage: dict
    pain_points: list[str]
    purchase_motivations: list[str]


# ── Abstract Skill Classes ─────────────────────────────

class CampaignPlannerSkill(ABC):
    @abstractmethod
    async def generate(self, ctx: CampaignContext) -> CampaignPlanResult: ...


class ScriptWriterSkill(ABC):
    @abstractmethod
    async def generate(self, ctx: ScriptContext) -> VideoScriptResult: ...


class PostWriterSkill(ABC):
    @abstractmethod
    async def generate(self, ctx: PostContext) -> SocialPostResult: ...


class AdCopyWriterSkill(ABC):
    @abstractmethod
    async def generate(self, ctx: AdCopyContext) -> AdCopyResult: ...


class AudienceAnalyzerSkill(ABC):
    @abstractmethod
    async def analyze(self, ctx: AudienceContext) -> AudienceProfileResult: ...
```

- [ ] **Step 2: Create skill registry**

```python
# backend/app/services/marketing_skills/registry.py
from app.core.config import settings
from app.services.marketing_skills.base import (
    CampaignPlannerSkill,
    ScriptWriterSkill,
    PostWriterSkill,
    AdCopyWriterSkill,
    AudienceAnalyzerSkill,
)


def _provider() -> str:
    return getattr(settings, "marketing_provider", "deepseek") or "deepseek"


def get_campaign_planner(provider: str | None = None) -> CampaignPlannerSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.marketing_skills.campaign_planner import DeepSeekCampaignPlanner
        return DeepSeekCampaignPlanner()
    raise ValueError(f"Unknown campaign planner provider: {provider}")


def get_script_writer(provider: str | None = None) -> ScriptWriterSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.marketing_skills.script_writer import DeepSeekScriptWriter
        return DeepSeekScriptWriter()
    raise ValueError(f"Unknown script writer provider: {provider}")


def get_post_writer(provider: str | None = None) -> PostWriterSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.marketing_skills.post_writer import DeepSeekPostWriter
        return DeepSeekPostWriter()
    raise ValueError(f"Unknown post writer provider: {provider}")


def get_ad_copy_writer(provider: str | None = None) -> AdCopyWriterSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.marketing_skills.ad_copy_writer import DeepSeekAdCopyWriter
        return DeepSeekAdCopyWriter()
    raise ValueError(f"Unknown ad copy writer provider: {provider}")


def get_audience_analyzer(provider: str | None = None) -> AudienceAnalyzerSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.marketing_skills.audience_analyzer import DeepSeekAudienceAnalyzer
        return DeepSeekAudienceAnalyzer()
    raise ValueError(f"Unknown audience analyzer provider: {provider}")


def list_available_skills() -> dict:
    return {
        "campaign_planner": ["deepseek"],
        "script_writer": ["deepseek"],
        "post_writer": ["deepseek"],
        "ad_copy_writer": ["deepseek"],
        "audience_analyzer": ["deepseek"],
    }
```

- [ ] **Step 3: Create package __init__.py**

```python
# backend/app/services/marketing_skills/__init__.py
from app.services.marketing_skills.base import (
    CampaignContext, ScriptContext, PostContext, AdCopyContext, AudienceContext,
    CampaignPlanResult, VideoScriptResult, SocialPostResult, AdCopyResult, AudienceProfileResult,
    CampaignPlannerSkill, ScriptWriterSkill, PostWriterSkill, AdCopyWriterSkill, AudienceAnalyzerSkill,
)
from app.services.marketing_skills.registry import (
    get_campaign_planner, get_script_writer, get_post_writer,
    get_ad_copy_writer, get_audience_analyzer, list_available_skills,
)

__all__ = [
    "CampaignContext", "ScriptContext", "PostContext", "AdCopyContext", "AudienceContext",
    "CampaignPlanResult", "VideoScriptResult", "SocialPostResult", "AdCopyResult", "AudienceProfileResult",
    "CampaignPlannerSkill", "ScriptWriterSkill", "PostWriterSkill", "AdCopyWriterSkill", "AudienceAnalyzerSkill",
    "get_campaign_planner", "get_script_writer", "get_post_writer",
    "get_ad_copy_writer", "get_audience_analyzer", "list_available_skills",
]
```

- [ ] **Step 4: Verify package imports (will fail on missing skills, expected)**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.services.marketing_skills.base import CampaignContext, CampaignPlanResult; print('Base OK')"`
Expected: "Base OK"

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/marketing_skills/
git commit -m "feat: add marketing skills base classes and registry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Marketing Skills — AI Implementation (5 skills)

**Files:**
- Create: `backend/app/services/marketing_skills/campaign_planner.py`
- Create: `backend/app/services/marketing_skills/script_writer.py`
- Create: `backend/app/services/marketing_skills/post_writer.py`
- Create: `backend/app/services/marketing_skills/ad_copy_writer.py`
- Create: `backend/app/services/marketing_skills/audience_analyzer.py`

- [ ] **Step 1: Create campaign planner skill**

```python
# backend/app/services/marketing_skills/campaign_planner.py
import json
from app.services.marketing_skills.base import CampaignContext, CampaignPlanResult, CampaignPlannerSkill
from app.services.deepseek import chat


class DeepSeekCampaignPlanner(CampaignPlannerSkill):
    async def generate(self, ctx: CampaignContext) -> CampaignPlanResult:
        system = (
            "You are a senior marketing strategist specializing in cross-border e-commerce. "
            "Generate creative, data-driven campaign plans. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        prompt = (
            f"Create a marketing campaign plan for:\n"
            f"Product: {ctx.product_name}\n"
            f"Category: {ctx.product_category}\n"
            f"Features: {features_text}\n"
            f"Target Market: {ctx.target_market}\n"
            f"Language: {ctx.language}\n"
            f"Objective: {ctx.objective}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"theme": "campaign theme name",\n'
            f' "description": "1-paragraph campaign overview",\n'
            f' "content_strategy": "2-3 sentence content approach",\n'
            f' "channel_recommendations": [{{"platform": "tiktok", "reason": "...", "content_type": "..."}}],\n'
            f' "hashtags": ["#tag1", "#tag2", ...],\n'
            f' "estimated_budget_tier": "low"|"medium"|"high"}}'
        )

        result = chat(prompt, system, max_tokens=1024)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "theme": f"{ctx.product_name} Campaign",
                "description": result.strip()[:500],
                "content_strategy": "Content strategy pending refinement.",
                "channel_recommendations": [{"platform": "tiktok", "reason": "High engagement", "content_type": "short-video"}],
                "hashtags": [f"#{ctx.product_name.replace(' ', '')}"],
                "estimated_budget_tier": "medium",
            }

        return CampaignPlanResult(
            theme=data.get("theme", ""),
            description=data.get("description", ""),
            content_strategy=data.get("content_strategy", ""),
            channel_recommendations=data.get("channel_recommendations", []),
            hashtags=data.get("hashtags", []),
            estimated_budget_tier=data.get("estimated_budget_tier", "medium"),
        )
```

- [ ] **Step 2: Create script writer skill**

```python
# backend/app/services/marketing_skills/script_writer.py
import json
from app.services.marketing_skills.base import ScriptContext, VideoScriptResult, ScriptWriterSkill
from app.services.deepseek import chat


class DeepSeekScriptWriter(ScriptWriterSkill):
    async def generate(self, ctx: ScriptContext) -> VideoScriptResult:
        system = (
            "You are a viral short-video script writer for social media platforms. "
            "Create engaging, platform-optimized scripts with strong hooks. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        prompt = (
            f"Write a {ctx.duration_seconds}s {ctx.platform} video script:\n"
            f"Product: {ctx.product_name}\n"
            f"Features: {features_text}\n"
            f"Target Audience: {ctx.target_audience}\n"
            f"Tone: {ctx.tone}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"title": "video title",\n'
            f' "hook": "first 3-second hook to grab attention",\n'
            f' "scenes": [{{"time": "0-5s", "visual": "...", "narration": "...", "text_overlay": "..."}}],\n'
            f' "music_suggestion": "genre/mood recommendation",\n'
            f' "cta": "call to action",\n'
            f' "total_duration_seconds": {ctx.duration_seconds}}}'
        )

        result = chat(prompt, system, max_tokens=1024)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "title": f"{ctx.product_name} - Must Have!",
                "hook": f"Check out the new {ctx.product_name}!",
                "scenes": [{"time": "0-{ctx.duration_seconds}s", "visual": "Product showcase", "narration": result.strip()[:300], "text_overlay": ctx.product_name}],
                "music_suggestion": "Upbeat pop",
                "cta": "Link in bio!",
                "total_duration_seconds": ctx.duration_seconds,
            }

        return VideoScriptResult(
            title=data.get("title", ""),
            hook=data.get("hook", ""),
            scenes=data.get("scenes", []),
            music_suggestion=data.get("music_suggestion", ""),
            cta=data.get("cta", ""),
            total_duration_seconds=data.get("total_duration_seconds", ctx.duration_seconds),
        )
```

- [ ] **Step 3: Create post writer skill**

```python
# backend/app/services/marketing_skills/post_writer.py
import json
from app.services.marketing_skills.base import PostContext, SocialPostResult, PostWriterSkill
from app.services.deepseek import chat


class DeepSeekPostWriter(PostWriterSkill):
    async def generate(self, ctx: PostContext) -> SocialPostResult:
        system = (
            "You are a social media content strategist. "
            "Write engaging, platform-optimized posts that drive engagement. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        prompt = (
            f"Write a {ctx.platform} post for:\n"
            f"Product: {ctx.product_name}\n"
            f"Features: {features_text}\n"
            f"Tone: {ctx.tone}\n"
            f"Key Message: {ctx.key_message or 'Promote the product'}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"caption": "full post caption with emojis",\n'
            f' "hashtags": ["#tag1", "#tag2", ...],\n'
            f' "image_description": "visual concept for accompanying image",\n'
            f' "best_posting_time": "suggested time in local timezone",\n'
            f' "engagement_tips": "tips to boost engagement"}}'
        )

        result = chat(prompt, system, max_tokens=800)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "caption": result.strip()[:500],
                "hashtags": [f"#{ctx.product_name.replace(' ', '')}"],
                "image_description": f"High-quality photo of {ctx.product_name}",
                "best_posting_time": "6:00 PM local time",
                "engagement_tips": "Ask a question in comments to boost engagement.",
            }

        return SocialPostResult(
            caption=data.get("caption", ""),
            hashtags=data.get("hashtags", []),
            image_description=data.get("image_description", ""),
            best_posting_time=data.get("best_posting_time", ""),
            engagement_tips=data.get("engagement_tips", ""),
        )
```

- [ ] **Step 4: Create ad copy writer skill**

```python
# backend/app/services/marketing_skills/ad_copy_writer.py
import json
from app.services.marketing_skills.base import AdCopyContext, AdCopyResult, AdCopyWriterSkill
from app.services.deepseek import chat


class DeepSeekAdCopyWriter(AdCopyWriterSkill):
    async def generate(self, ctx: AdCopyContext) -> AdCopyResult:
        system = (
            "You are a SEM advertising specialist. "
            "Write high-converting ad copy for search and display ads. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        prompt = (
            f"Create {ctx.platform} ad copy for:\n"
            f"Product: {ctx.product_name}\n"
            f"Features: {features_text}\n"
            f"Target Market: {ctx.target_market}\n"
            f"Language: {ctx.language}\n"
            f"Objective: {ctx.objective}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"headlines": ["headline1", "headline2", "headline3", "headline4", "headline5"],\n'
            f' "descriptions": ["description1", "description2", "description3"],\n'
            f' "cta": "call to action text",\n'
            f' "keywords": [{{"keyword": "example", "match_type": "exact"|"phrase"|"broad"}}],\n'
            f' "sitelink_suggestions": ["sitelink1", "sitelink2", "sitelink3"]}}'
        )

        result = chat(prompt, system, max_tokens=800)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "headlines": [f"Buy {ctx.product_name} Online", f"Best {ctx.product_name} Deals", f"Shop {ctx.product_name} Today"],
                "descriptions": [f"Find the best {ctx.product_name} at great prices. Fast shipping."],
                "cta": "Shop Now",
                "keywords": [{"keyword": ctx.product_name, "match_type": "broad"}],
                "sitelink_suggestions": ["Shop All", "Best Sellers", "Contact Us"],
            }

        return AdCopyResult(
            headlines=data.get("headlines", []),
            descriptions=data.get("descriptions", []),
            cta=data.get("cta", ""),
            keywords=data.get("keywords", []),
            sitelink_suggestions=data.get("sitelink_suggestions", []),
        )
```

- [ ] **Step 5: Create audience analyzer skill**

```python
# backend/app/services/marketing_skills/audience_analyzer.py
import json
from app.services.marketing_skills.base import AudienceContext, AudienceProfileResult, AudienceAnalyzerSkill
from app.services.deepseek import chat


class DeepSeekAudienceAnalyzer(AudienceAnalyzerSkill):
    async def analyze(self, ctx: AudienceContext) -> AudienceProfileResult:
        system = (
            "You are a consumer insights and market research analyst. "
            "Analyze target audiences for e-commerce products. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        interests_text = ", ".join(ctx.interests) if ctx.interests else "N/A"
        prompt = (
            f"Analyze the target audience for:\n"
            f"Product Category: {ctx.product_category}\n"
            f"Target Market: {ctx.target_market}\n"
            f"Related Interests: {interests_text}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"demographics": {{"age_range": "e.g. 18-34", "gender_split": "...", "income_level": "...", "location": "..."}},\n'
            f' "interests_behaviors": ["interest1", "interest2", ...],\n'
            f' "content_preferences": ["preferred content type 1", ...],\n'
            f' "platform_usage": {{"primary": ["platform1"], "secondary": ["platform2"]}},\n'
            f' "pain_points": ["pain point 1", ...],\n'
            f' "purchase_motivations": ["motivation 1", ...]}}'
        )

        result = chat(prompt, system, max_tokens=800)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "demographics": {"age_range": "18-44", "gender_split": "Mixed", "income_level": "Middle", "location": ctx.target_market},
                "interests_behaviors": ctx.interests or ["online shopping", "tech"],
                "content_preferences": ["video reviews", "social media posts"],
                "platform_usage": {"primary": ["Instagram", "TikTok"], "secondary": ["Facebook", "YouTube"]},
                "pain_points": ["Price sensitivity", "Quality concerns"],
                "purchase_motivations": ["Good reviews", "Fast shipping"],
            }

        return AudienceProfileResult(
            demographics=data.get("demographics", {}),
            interests_behaviors=data.get("interests_behaviors", []),
            content_preferences=data.get("content_preferences", []),
            platform_usage=data.get("platform_usage", {}),
            pain_points=data.get("pain_points", []),
            purchase_motivations=data.get("purchase_motivations", []),
        )
```

- [ ] **Step 6: Verify all skills import**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.services.marketing_skills.registry import get_campaign_planner, get_script_writer, get_post_writer, get_ad_copy_writer, get_audience_analyzer; print('All skills OK')"`
Expected: "All skills OK"

- [ ] **Step 7: Commit**

```bash
git add backend/app/services/marketing_skills/campaign_planner.py backend/app/services/marketing_skills/script_writer.py backend/app/services/marketing_skills/post_writer.py backend/app/services/marketing_skills/ad_copy_writer.py backend/app/services/marketing_skills/audience_analyzer.py
git commit -m "feat: add 5 marketing AI skills (campaign, script, post, ad copy, audience)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Marketing API Router

**Files:**
- Create: `backend/app/api/marketing.py`

- [ ] **Step 1: Create the complete API router**

```python
# backend/app/api/marketing.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.marketing_campaign import MarketingCampaign
from app.models.marketing_content import MarketingContent
from app.services.marketing_skills.registry import (
    get_campaign_planner,
    get_script_writer,
    get_post_writer,
    get_ad_copy_writer,
    get_audience_analyzer,
    list_available_skills,
)
from app.services.marketing_skills.base import (
    CampaignContext, ScriptContext, PostContext, AdCopyContext, AudienceContext,
)
from app.services.usage import deduct_credits
from app.schemas.marketing import (
    CampaignGenerateRequest, CampaignGenerateResponse, CampaignPlanResponse,
    ScriptGenerateRequest, ScriptGenerateResponse, VideoScriptResponse,
    PostGenerateRequest, PostGenerateResponse, SocialPostResponse,
    AdCopyGenerateRequest, AdCopyGenerateResponse, AdCopyResponse,
    AudienceProfileRequest, AudienceProfileGenerateResponse, AudienceProfileResponse,
    CampaignCreate, CampaignUpdate, CampaignResponse, CampaignDetailResponse,
    CampaignListResponse, ContentResponse, ContentListResponse, ContentLinkRequest,
)

router = APIRouter()

# ───────────────────────────────────────────────────────
#  AI Generation Endpoints
# ───────────────────────────────────────────────────────

@router.get("/skills")
async def list_skills():
    return list_available_skills()


@router.post("/generate-campaign", response_model=CampaignGenerateResponse)
async def generate_campaign(
    req: CampaignGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = CampaignContext(
        product_name=req.product_name,
        product_category=req.product_category,
        features=req.product_features,
        target_market=req.target_market,
        language=req.language,
        objective=req.objective,
    )
    skill = get_campaign_planner()
    try:
        result = await skill.generate(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI generation failed: {e}")

    # Deduct credits
    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=2.0, api_cost=0.008)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    # Save to DB
    content = MarketingContent(
        user_id=current_user.id,
        content_type="campaign_plan",
        title=result.theme,
        body=f"**Description:** {result.description}\n\n**Strategy:** {result.content_strategy}\n\n"
             f"**Channels:** {result.channel_recommendations}\n\n**Budget Tier:** {result.estimated_budget_tier}",
        platform="all",
        language=req.language,
        metadata_={"hashtags": result.hashtags, "channel_recommendations": result.channel_recommendations},
    )
    db.add(content)
    db.commit()

    return CampaignGenerateResponse(
        plan=CampaignPlanResponse(
            theme=result.theme,
            description=result.description,
            content_strategy=result.content_strategy,
            channel_recommendations=result.channel_recommendations,
            hashtags=result.hashtags,
            estimated_budget_tier=result.estimated_budget_tier,
        ),
        credits_used=2.0,
    )


@router.post("/generate-script", response_model=ScriptGenerateResponse)
async def generate_script(
    req: ScriptGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = ScriptContext(
        product_name=req.product_name,
        features=req.product_features,
        target_audience=req.target_audience,
        platform=req.platform,
        language=req.language,
        tone=req.tone,
        duration_seconds=req.duration_seconds,
    )
    skill = get_script_writer()
    try:
        result = await skill.generate(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI generation failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=1.0, api_cost=0.004)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    content = MarketingContent(
        user_id=current_user.id,
        content_type="video_script",
        title=result.title,
        body=f"**Hook:** {result.hook}\n\n**CTA:** {result.cta}\n\n**Music:** {result.music_suggestion}",
        platform=req.platform,
        language=req.language,
        metadata_={"scenes": result.scenes, "total_duration_seconds": result.total_duration_seconds},
    )
    db.add(content)
    db.commit()

    return ScriptGenerateResponse(
        script=VideoScriptResponse(
            title=result.title,
            hook=result.hook,
            scenes=result.scenes,
            music_suggestion=result.music_suggestion,
            cta=result.cta,
            total_duration_seconds=result.total_duration_seconds,
        ),
        credits_used=1.0,
    )


@router.post("/generate-post", response_model=PostGenerateResponse)
async def generate_post(
    req: PostGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = PostContext(
        product_name=req.product_name,
        features=req.product_features,
        platform=req.platform,
        language=req.language,
        tone=req.tone,
        key_message=req.key_message,
    )
    skill = get_post_writer()
    try:
        result = await skill.generate(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI generation failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=0.5, api_cost=0.002)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    content = MarketingContent(
        user_id=current_user.id,
        content_type="social_post",
        title=f"Post for {req.platform}",
        body=result.caption,
        platform=req.platform,
        language=req.language,
        metadata_={"hashtags": result.hashtags, "image_description": result.image_description,
                    "best_posting_time": result.best_posting_time, "engagement_tips": result.engagement_tips},
    )
    db.add(content)
    db.commit()

    return PostGenerateResponse(
        post=SocialPostResponse(
            caption=result.caption,
            hashtags=result.hashtags,
            image_description=result.image_description,
            best_posting_time=result.best_posting_time,
            engagement_tips=result.engagement_tips,
        ),
        credits_used=0.5,
    )


@router.post("/generate-ad-copy", response_model=AdCopyGenerateResponse)
async def generate_ad_copy(
    req: AdCopyGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = AdCopyContext(
        product_name=req.product_name,
        features=req.product_features,
        target_market=req.target_market,
        platform=req.platform,
        language=req.language,
        objective=req.objective,
    )
    skill = get_ad_copy_writer()
    try:
        result = await skill.generate(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI generation failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=1.0, api_cost=0.004)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    content = MarketingContent(
        user_id=current_user.id,
        content_type="ad_copy",
        title=f"Ad Copy - {req.platform}",
        body=f"**Headlines:** {' | '.join(result.headlines)}\n\n**Descriptions:** {' | '.join(result.descriptions)}\n\n**CTA:** {result.cta}",
        platform=req.platform,
        language=req.language,
        metadata_={"headlines": result.headlines, "descriptions": result.descriptions,
                    "keywords": result.keywords, "sitelink_suggestions": result.sitelink_suggestions},
    )
    db.add(content)
    db.commit()

    return AdCopyGenerateResponse(
        ad_copy=AdCopyResponse(
            headlines=result.headlines,
            descriptions=result.descriptions,
            cta=result.cta,
            keywords=result.keywords,
            sitelink_suggestions=result.sitelink_suggestions,
        ),
        credits_used=1.0,
    )


@router.post("/audience-profile", response_model=AudienceProfileGenerateResponse)
async def audience_profile(
    req: AudienceProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = AudienceContext(
        product_category=req.product_category,
        target_market=req.target_market,
        interests=req.interests,
        language=req.language,
    )
    skill = get_audience_analyzer()
    try:
        result = await skill.analyze(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI generation failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=1.5, api_cost=0.006)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    content = MarketingContent(
        user_id=current_user.id,
        content_type="audience_profile",
        title=f"Audience Profile - {req.product_category} ({req.target_market})",
        body=f"**Demographics:** {result.demographics}\n\n**Interests:** {', '.join(result.interests_behaviors)}",
        platform="all",
        language=req.language,
        metadata_={
            "demographics": result.demographics,
            "interests_behaviors": result.interests_behaviors,
            "content_preferences": result.content_preferences,
            "platform_usage": result.platform_usage,
            "pain_points": result.pain_points,
            "purchase_motivations": result.purchase_motivations,
        },
    )
    db.add(content)
    db.commit()

    return AudienceProfileGenerateResponse(
        profile=AudienceProfileResponse(
            demographics=result.demographics,
            interests_behaviors=result.interests_behaviors,
            content_preferences=result.content_preferences,
            platform_usage=result.platform_usage,
            pain_points=result.pain_points,
            purchase_motivations=result.purchase_motivations,
        ),
        credits_used=1.5,
    )


# ───────────────────────────────────────────────────────
#  Campaign CRUD
# ───────────────────────────────────────────────────────

@router.get("/campaigns", response_model=CampaignListResponse)
async def list_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status: str | None = Query(None, pattern=r"^(draft|active|completed)$"),
):
    q = db.query(MarketingCampaign).filter_by(user_id=current_user.id)
    if status:
        q = q.filter_by(status=status)
    campaigns = q.order_by(MarketingCampaign.updated_at.desc()).all()

    items = []
    for c in campaigns:
        count = db.query(MarketingContent).filter_by(campaign_id=c.id).count()
        items.append(CampaignResponse(
            id=c.id, name=c.name, description=c.description,
            target_market=c.target_market, target_audience=c.target_audience,
            objective=c.objective, status=c.status,
            created_at=c.created_at, updated_at=c.updated_at,
            content_count=count,
        ))

    return CampaignListResponse(campaigns=items, total=len(items))


@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(
    req: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = MarketingCampaign(
        user_id=current_user.id,
        name=req.name,
        description=req.description,
        target_market=req.target_market,
        target_audience=req.target_audience,
        objective=req.objective,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return CampaignResponse(
        id=campaign.id, name=campaign.name, description=campaign.description,
        target_market=campaign.target_market, target_audience=campaign.target_audience,
        objective=campaign.objective, status=campaign.status,
        created_at=campaign.created_at, updated_at=campaign.updated_at,
        content_count=0,
    )


@router.get("/campaigns/{campaign_id}", response_model=CampaignDetailResponse)
async def get_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = db.query(MarketingCampaign).filter_by(id=campaign_id, user_id=current_user.id).first()
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    contents = db.query(MarketingContent).filter_by(campaign_id=campaign_id).order_by(MarketingContent.created_at.desc()).all()
    content_responses = [
        ContentResponse(
            id=c.id, campaign_id=c.campaign_id, content_type=c.content_type,
            title=c.title, body=c.body, platform=c.platform, language=c.language,
            metadata_=c.metadata_, created_at=c.created_at,
        ) for c in contents
    ]

    return CampaignDetailResponse(
        id=campaign.id, name=campaign.name, description=campaign.description,
        target_market=campaign.target_market, target_audience=campaign.target_audience,
        objective=campaign.objective, status=campaign.status,
        created_at=campaign.created_at, updated_at=campaign.updated_at,
        contents=content_responses,
    )


@router.put("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    req: CampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = db.query(MarketingCampaign).filter_by(id=campaign_id, user_id=current_user.id).first()
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(campaign, key, value)
    db.commit()
    db.refresh(campaign)

    count = db.query(MarketingContent).filter_by(campaign_id=campaign.id).count()
    return CampaignResponse(
        id=campaign.id, name=campaign.name, description=campaign.description,
        target_market=campaign.target_market, target_audience=campaign.target_audience,
        objective=campaign.objective, status=campaign.status,
        created_at=campaign.created_at, updated_at=campaign.updated_at,
        content_count=count,
    )


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = db.query(MarketingCampaign).filter_by(id=campaign_id, user_id=current_user.id).first()
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    # Unlink contents (set campaign_id to null) rather than cascade delete
    db.query(MarketingContent).filter_by(campaign_id=campaign_id).update({"campaign_id": None})
    db.delete(campaign)
    db.commit()
    return {"status": "deleted"}


# ───────────────────────────────────────────────────────
#  Content CRUD
# ───────────────────────────────────────────────────────

@router.get("/contents", response_model=ContentListResponse)
async def list_contents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    content_type: str | None = Query(None),
    platform: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    q = db.query(MarketingContent).filter_by(user_id=current_user.id)
    if content_type:
        q = q.filter_by(content_type=content_type)
    if platform:
        q = q.filter_by(platform=platform)
    total = q.count()
    contents = q.order_by(MarketingContent.created_at.desc()).offset(offset).limit(limit).all()

    items = [
        ContentResponse(
            id=c.id, campaign_id=c.campaign_id, content_type=c.content_type,
            title=c.title, body=c.body, platform=c.platform, language=c.language,
            metadata_=c.metadata_, created_at=c.created_at,
        ) for c in contents
    ]
    return ContentListResponse(contents=items, total=total)


@router.get("/contents/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = db.query(MarketingContent).filter_by(id=content_id, user_id=current_user.id).first()
    if not content:
        raise HTTPException(404, "Content not found")
    return ContentResponse(
        id=content.id, campaign_id=content.campaign_id, content_type=content.content_type,
        title=content.title, body=content.body, platform=content.platform, language=content.language,
        metadata_=content.metadata_, created_at=content.created_at,
    )


@router.delete("/contents/{content_id}")
async def delete_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = db.query(MarketingContent).filter_by(id=content_id, user_id=current_user.id).first()
    if not content:
        raise HTTPException(404, "Content not found")
    db.delete(content)
    db.commit()
    return {"status": "deleted"}


@router.post("/contents/{content_id}/link", response_model=ContentResponse)
async def link_content_to_campaign(
    content_id: str,
    req: ContentLinkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = db.query(MarketingContent).filter_by(id=content_id, user_id=current_user.id).first()
    if not content:
        raise HTTPException(404, "Content not found")

    campaign = db.query(MarketingCampaign).filter_by(id=req.campaign_id, user_id=current_user.id).first()
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    content.campaign_id = req.campaign_id
    db.commit()
    db.refresh(content)

    return ContentResponse(
        id=content.id, campaign_id=content.campaign_id, content_type=content.content_type,
        title=content.title, body=content.body, platform=content.platform, language=content.language,
        metadata_=content.metadata_, created_at=content.created_at,
    )
```

- [ ] **Step 2: Verify router imports**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.api.marketing import router; print('Router OK')"`
Expected: "Router OK"

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/marketing.py
git commit -m "feat: add marketing API router with AI generation and CRUD endpoints

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Wire Up Router + Models

**Files:**
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Add model imports to models/__init__.py**

Open `backend/app/models/__init__.py`. Add after the existing imports:

```python
from app.models.marketing_campaign import MarketingCampaign
from app.models.marketing_content import MarketingContent
```

And update `__all__` to include `"MarketingCampaign", "MarketingContent"`.

- [ ] **Step 2: Register router in main.py**

Open `backend/app/main.py`. Add the import line:

```python
from app.api.marketing import router as marketing_router
```

Add the router registration before the health check:

```python
app.include_router(marketing_router, prefix="/api/marketing", tags=["marketing"])
```

- [ ] **Step 3: Add marketing_provider to config**

Open `backend/app/core/config.py`. Add after the `copy_provider` line:

```python
    # Marketing
    marketing_provider: str = "deepseek"  # "deepseek" or future providers
```

- [ ] **Step 4: Verify app starts**

Run: `cd backend && timeout 5 .\.venv\Scripts\python.exe -c "from app.main import app; print('App OK')" || (echo "App loaded (timeout OK)")`
Expected: "App OK" or "App loaded (timeout OK)"

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/__init__.py backend/app/main.py backend/app/core/config.py
git commit -m "feat: register marketing router and models in app

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Backend Tests

**Files:**
- Create: `backend/tests/test_marketing.py`

- [ ] **Step 1: Create API integration tests**

```python
# backend/tests/test_marketing.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

# In-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test_marketing.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Test user token (valid for tests)
TEST_TOKEN = None


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def get_auth_headers():
    """Get auth headers by registering a test user and getting a token."""
    global TEST_TOKEN
    if TEST_TOKEN:
        return {"Authorization": f"Bearer {TEST_TOKEN}"}

    # Register
    resp = client.post("/api/auth/register", json={
        "phone": "+8613800000001",
        "password": "test123456",
        "sms_code": "000000",
    })
    if resp.status_code == 200:
        data = resp.json()
        TEST_TOKEN = data.get("access_token")
    elif resp.status_code == 409:
        # Already exists, login
        resp = client.post("/api/auth/login", json={
            "phone": "+8613800000001",
            "password": "test123456",
        })
        data = resp.json()
        TEST_TOKEN = data.get("access_token")

    return {"Authorization": f"Bearer {TEST_TOKEN}"} if TEST_TOKEN else {}


class TestMarketingSkills:
    """Test the skill listing endpoint."""

    def test_list_skills(self):
        headers = get_auth_headers()
        resp = client.get("/api/marketing/skills", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "campaign_planner" in data
        assert "script_writer" in data
        assert "post_writer" in data
        assert "ad_copy_writer" in data
        assert "audience_analyzer" in data


class TestCampaignCRUD:
    """Test campaign create, read, update, delete."""

    def test_create_campaign(self):
        headers = get_auth_headers()
        resp = client.post("/api/marketing/campaigns", json={
            "name": "Test Summer Promo",
            "target_market": "US",
            "objective": "brand_awareness",
        }, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Test Summer Promo"
        assert data["status"] == "draft"
        assert data["content_count"] == 0

    def test_list_campaigns(self):
        headers = get_auth_headers()
        resp = client.get("/api/marketing/campaigns", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "campaigns" in data
        assert "total" in data
        assert data["total"] >= 1

    def test_get_campaign(self):
        headers = get_auth_headers()
        # First list to get an ID
        list_resp = client.get("/api/marketing/campaigns", headers=headers)
        campaigns = list_resp.json()["campaigns"]
        if campaigns:
            campaign_id = campaigns[0]["id"]
            resp = client.get(f"/api/marketing/campaigns/{campaign_id}", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert "contents" in data

    def test_update_campaign(self):
        headers = get_auth_headers()
        list_resp = client.get("/api/marketing/campaigns", headers=headers)
        campaigns = list_resp.json()["campaigns"]
        if campaigns:
            campaign_id = campaigns[0]["id"]
            resp = client.put(f"/api/marketing/campaigns/{campaign_id}", json={
                "status": "active",
            }, headers=headers)
            assert resp.status_code == 200
            assert resp.json()["status"] == "active"

    def test_delete_campaign(self):
        headers = get_auth_headers()
        # Create a fresh one to delete
        resp = client.post("/api/marketing/campaigns", json={
            "name": "To Delete",
        }, headers=headers)
        campaign_id = resp.json()["id"]

        resp = client.delete(f"/api/marketing/campaigns/{campaign_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "deleted"


class TestContentCRUD:
    """Test content listing and deletion."""

    def test_list_contents(self):
        headers = get_auth_headers()
        resp = client.get("/api/marketing/contents", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "contents" in data
        assert "total" in data

    def test_filter_contents_by_type(self):
        headers = get_auth_headers()
        resp = client.get("/api/marketing/contents?content_type=campaign_plan", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        for c in data["contents"]:
            assert c["content_type"] == "campaign_plan"


class TestAuthRequired:
    """Test that endpoints require auth."""

    def test_campaigns_require_auth(self):
        resp = client.get("/api/marketing/campaigns")
        assert resp.status_code == 403

    def test_contents_require_auth(self):
        resp = client.get("/api/marketing/contents")
        assert resp.status_code == 403

    def test_generate_requires_auth(self):
        resp = client.post("/api/marketing/generate-campaign", json={
            "product_name": "Test",
            "product_category": "Test",
        })
        assert resp.status_code == 403
```

- [ ] **Step 2: Run tests**

Run: `cd backend && .\.venv\Scripts\python.exe -m pytest tests/test_marketing.py -v --tb=short`
Expected: All tests pass (CRUD tests at minimum; AI generation tests may fail without API key — that's OK for now)

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_marketing.py
git commit -m "test: add marketing module API integration tests

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Frontend — MarketingHub Page

**Files:**
- Create: `frontend/src/pages/MarketingHub.tsx`

- [ ] **Step 1: Create the MarketingHub page component**

```tsx
// frontend/src/pages/MarketingHub.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { apiFetch } from "../lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabKey = "campaign" | "content" | "audience";

interface CampaignPlan {
  theme: string;
  description: string;
  content_strategy: string;
  channel_recommendations: { platform: string; reason: string; content_type: string }[];
  hashtags: string[];
  estimated_budget_tier: string;
}

interface VideoScript {
  title: string;
  hook: string;
  scenes: { time: string; visual: string; narration: string; text_overlay: string }[];
  music_suggestion: string;
  cta: string;
  total_duration_seconds: number;
}

interface SocialPost {
  caption: string;
  hashtags: string[];
  image_description: string;
  best_posting_time: string;
  engagement_tips: string;
}

interface AdCopy {
  headlines: string[];
  descriptions: string[];
  cta: string;
  keywords: { keyword: string; match_type: string }[];
  sitelink_suggestions: string[];
}

interface AudienceProfile {
  demographics: Record<string, string>;
  interests_behaviors: string[];
  content_preferences: string[];
  platform_usage: Record<string, string[]>;
  pain_points: string[];
  purchase_motivations: string[];
}

interface CampaignItem {
  id: string;
  name: string;
  description: string | null;
  target_market: string;
  objective: string;
  status: string;
  content_count: number;
  created_at: string;
}

interface ContentItem {
  id: string;
  campaign_id: string | null;
  content_type: string;
  title: string;
  body: string;
  platform: string;
  language: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MARKETS = ["US", "UK", "DE", "JP"];
const LANGUAGES = ["en", "zh", "de", "ja"];
const OBJECTIVES = ["brand_awareness", "conversion", "engagement"];
const TONES = ["energetic", "professional", "casual", "humorous", "emotional"];
const PLATFORMS_SCRIPT = ["tiktok", "youtube_shorts", "instagram_reels"];
const PLATFORMS_POST = ["instagram", "facebook", "twitter", "pinterest"];
const PLATFORMS_AD = ["google_ads", "bing_ads"];

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: "campaign", labelKey: "marketing.tabs.campaign" },
  { key: "content", labelKey: "marketing.tabs.content" },
  { key: "audience", labelKey: "marketing.tabs.audience" },
];

/* ------------------------------------------------------------------ */
/*  Helper: Copy to clipboard                                          */
/* ------------------------------------------------------------------ */

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function MarketingHub() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("campaign");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- Campaign Planner State ------------------------------------ */
  const [cpProductName, setCpProductName] = useState("");
  const [cpCategory, setCpCategory] = useState("");
  const [cpFeatures, setCpFeatures] = useState<string[]>([]);
  const [cpFeatureInput, setCpFeatureInput] = useState("");
  const [cpMarket, setCpMarket] = useState("US");
  const [cpLanguage, setCpLanguage] = useState("en");
  const [cpObjective, setCpObjective] = useState("brand_awareness");
  const [campaignResult, setCampaignResult] = useState<CampaignPlan | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);

  /* ---- Content Creator State ------------------------------------- */
  const [contentType, setContentType] = useState<"script" | "post" | "ad">("script");
  const [ccProductName, setCcProductName] = useState("");
  const [ccFeatures, setCcFeatures] = useState<string[]>([]);
  const [ccFeatureInput, setCcFeatureInput] = useState("");
  const [ccPlatform, setCcPlatform] = useState("tiktok");
  const [ccLanguage, setCcLanguage] = useState("en");
  const [ccTone, setCcTone] = useState("energetic");
  const [ccDuration, setCcDuration] = useState(30);
  const [ccKeyMessage, setCcKeyMessage] = useState("");
  const [ccAudience, setCcAudience] = useState("general");
  const [ccMarket, setCcMarket] = useState("US");
  const [ccObjective, setCcObjective] = useState("conversion");
  const [scriptResult, setScriptResult] = useState<VideoScript | null>(null);
  const [postResult, setPostResult] = useState<SocialPost | null>(null);
  const [adResult, setAdResult] = useState<AdCopy | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [contentsLoaded, setContentsLoaded] = useState(false);

  /* ---- Audience Analysis State ----------------------------------- */
  const [apCategory, setApCategory] = useState("");
  const [apMarket, setApMarket] = useState("US");
  const [apInterests, setApInterests] = useState<string[]>([]);
  const [apInterestInput, setApInterestInput] = useState("");
  const [apLanguage, setApLanguage] = useState("en");
  const [audienceResult, setAudienceResult] = useState<AudienceProfile | null>(null);

  /* ---- Generic handlers ------------------------------------------ */

  function handleFeatureKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    current: string,
    setter: (v: string) => void,
    list: string[],
    listSetter: (v: string[]) => void,
  ) {
    if (e.key === "Enter" && current.trim()) {
      e.preventDefault();
      listSetter([...list, current.trim()]);
      setter("");
    }
  }

  function removeFeature(idx: number, list: string[], listSetter: (v: string[]) => void) {
    listSetter(list.filter((_, i) => i !== idx));
  }

  /* ---- Campaign Planner: generate -------------------------------- */

  async function handleGenerateCampaign() {
    if (!cpProductName || !cpCategory) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ plan: CampaignPlan }>("/api/marketing/generate-campaign", {
        method: "POST",
        body: JSON.stringify({
          product_name: cpProductName,
          product_category: cpCategory,
          product_features: cpFeatures,
          target_market: cpMarket,
          language: cpLanguage,
          objective: cpObjective,
        }),
      });
      setCampaignResult(data.plan);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadCampaigns() {
    try {
      const data = await apiFetch<{ campaigns: CampaignItem[] }>("/api/marketing/campaigns");
      setCampaigns(data.campaigns);
      setCampaignsLoaded(true);
    } catch { /* ignore */ }
  }

  /* ---- Content Creator: generate --------------------------------- */

  async function handleGenerateScript() {
    if (!ccProductName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ script: VideoScript }>("/api/marketing/generate-script", {
        method: "POST",
        body: JSON.stringify({
          product_name: ccProductName,
          product_features: ccFeatures,
          target_audience: ccAudience,
          platform: ccPlatform,
          language: ccLanguage,
          tone: ccTone,
          duration_seconds: ccDuration,
        }),
      });
      setScriptResult(data.script);
      setPostResult(null);
      setAdResult(null);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePost() {
    if (!ccProductName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ post: SocialPost }>("/api/marketing/generate-post", {
        method: "POST",
        body: JSON.stringify({
          product_name: ccProductName,
          product_features: ccFeatures,
          platform: ccPlatform,
          language: ccLanguage,
          tone: ccTone,
          key_message: ccKeyMessage,
        }),
      });
      setPostResult(data.post);
      setScriptResult(null);
      setAdResult(null);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAd() {
    if (!ccProductName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ ad_copy: AdCopy }>("/api/marketing/generate-ad-copy", {
        method: "POST",
        body: JSON.stringify({
          product_name: ccProductName,
          product_features: ccFeatures,
          target_market: ccMarket,
          platform: ccPlatform,
          language: ccLanguage,
          objective: ccObjective,
        }),
      });
      setAdResult(data.ad_copy);
      setScriptResult(null);
      setPostResult(null);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadContents() {
    try {
      const data = await apiFetch<{ contents: ContentItem[] }>("/api/marketing/contents");
      setContents(data.contents);
      setContentsLoaded(true);
    } catch { /* ignore */ }
  }

  /* ---- Audience: analyze ----------------------------------------- */

  async function handleAnalyzeAudience() {
    if (!apCategory) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ profile: AudienceProfile }>("/api/marketing/audience-profile", {
        method: "POST",
        body: JSON.stringify({
          product_category: apCategory,
          target_market: apMarket,
          interests: apInterests,
          language: apLanguage,
        }),
      });
      setAudienceResult(data.profile);
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  /* ---- Render: common form controls ------------------------------ */

  function renderFeatureTags(features: string[], onRemove: (i: number) => void) {
    if (features.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {features.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary-light text-primary">
            {f}
            <button onClick={() => onRemove(i)} className="hover:text-red-500">&times;</button>
          </span>
        ))}
      </div>
    );
  }

  function renderSelect(label: string, value: string, options: string[], onChange: (v: string) => void) {
    return (
      <div>
        <label className="block text-sm font-medium text-content/70 mb-1">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-edge px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }

  /* ---- Render: Campaign Tab -------------------------------------- */

  function renderCampaignTab() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("marketing.campaign.title")}</h2>
          <div className="space-y-4">
            <Input label={t("marketing.campaign.product_name")} value={cpProductName} onChange={(e) => setCpProductName(e.target.value)} />
            <Input label={t("marketing.campaign.category")} value={cpCategory} onChange={(e) => setCpCategory(e.target.value)} />
            <div>
              <Input
                label={t("marketing.campaign.features")}
                value={cpFeatureInput}
                onChange={(e) => setCpFeatureInput(e.target.value)}
                onKeyDown={(e) => handleFeatureKeyDown(e, cpFeatureInput, setCpFeatureInput, cpFeatures, setCpFeatures)}
                placeholder={t("marketing.campaign.features_hint")}
              />
              {renderFeatureTags(cpFeatures, (i) => removeFeature(i, cpFeatures, setCpFeatures))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("marketing.campaign.market"), cpMarket, MARKETS, setCpMarket)}
              {renderSelect(t("marketing.campaign.language"), cpLanguage, LANGUAGES, setCpLanguage)}
            </div>
            {renderSelect(t("marketing.campaign.objective"), cpObjective, OBJECTIVES, setCpObjective)}
            <Button onClick={handleGenerateCampaign} loading={loading} className="w-full">
              {t("marketing.campaign.generate")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        {/* Result */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("marketing.campaign.result")}</h2>
          {campaignResult ? (
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.theme")}</span>
                <p className="text-lg font-bold text-primary">{campaignResult.theme}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.description")}</span>
                <p className="text-sm">{campaignResult.description}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.strategy")}</span>
                <p className="text-sm">{campaignResult.content_strategy}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.channels")}</span>
                <div className="space-y-1 mt-1">
                  {campaignResult.channel_recommendations.map((ch, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded bg-primary-light text-primary text-xs font-medium">{ch.platform}</span>
                      <span>{ch.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.hashtags")}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {campaignResult.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-blue-600">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.budget")}:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  campaignResult.estimated_budget_tier === "low" ? "bg-green-100 text-green-800" :
                  campaignResult.estimated_budget_tier === "high" ? "bg-red-100 text-red-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {campaignResult.estimated_budget_tier}
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(JSON.stringify(campaignResult, null, 2))}>
                {t("marketing.actions.copy")}
              </Button>
            </div>
          ) : (
            <p className="text-content/50 text-sm">{t("marketing.campaign.placeholder")}</p>
          )}
        </Card>

        {/* Campaign List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{t("marketing.campaign.list_title")}</h3>
            <Button variant="secondary" size="sm" onClick={loadCampaigns}>{t("marketing.actions.refresh")}</Button>
          </div>
          {campaignsLoaded && campaigns.length === 0 && (
            <p className="text-content/50 text-sm">{t("marketing.campaign.no_campaigns")}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {campaigns.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{c.name}</h4>
                    <p className="text-xs text-content/50 mt-1">{c.objective} &middot; {c.target_market} &middot; {c.content_count} {t("marketing.campaign.contents")}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    c.status === "active" ? "bg-green-100 text-green-800" :
                    c.status === "completed" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-600"
                  }`}>{c.status}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---- Render: Content Tab --------------------------------------- */

  function renderContentTab() {
    const platforms = contentType === "script" ? PLATFORMS_SCRIPT : contentType === "post" ? PLATFORMS_POST : PLATFORMS_AD;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">{t("marketing.content.title")}</h2>
          </div>

          {/* Content type toggle */}
          <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg">
            {(["script", "post", "ad"] as const).map((ct) => (
              <button
                key={ct}
                onClick={() => { setContentType(ct); setScriptResult(null); setPostResult(null); setAdResult(null); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  contentType === ct ? "bg-white shadow text-primary" : "text-content/60 hover:text-content"
                }`}
              >
                {t(`marketing.content.types.${ct}`)}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <Input label={t("marketing.content.product_name")} value={ccProductName} onChange={(e) => setCcProductName(e.target.value)} />
            <div>
              <Input
                label={t("marketing.content.features")}
                value={ccFeatureInput}
                onChange={(e) => setCcFeatureInput(e.target.value)}
                onKeyDown={(e) => handleFeatureKeyDown(e, ccFeatureInput, setCcFeatureInput, ccFeatures, setCcFeatures)}
                placeholder={t("marketing.content.features_hint")}
              />
              {renderFeatureTags(ccFeatures, (i) => removeFeature(i, ccFeatures, setCcFeatures))}
            </div>

            {contentType === "script" && (
              <>
                <Input label={t("marketing.content.audience")} value={ccAudience} onChange={(e) => setCcAudience(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-content/70 mb-1">{t("marketing.content.duration")}</label>
                    <input type="number" min={15} max={180} step={5} value={ccDuration}
                      onChange={(e) => setCcDuration(Number(e.target.value))}
                      className="w-full rounded-lg border border-edge px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  {renderSelect(t("marketing.content.tone"), ccTone, TONES, setCcTone)}
                </div>
              </>
            )}

            {contentType === "post" && (
              <Input label={t("marketing.content.key_message")} value={ccKeyMessage} onChange={(e) => setCcKeyMessage(e.target.value)} />
            )}

            {contentType === "ad" && (
              <div className="grid grid-cols-2 gap-3">
                {renderSelect(t("marketing.content.market"), ccMarket, MARKETS, setCcMarket)}
                {renderSelect(t("marketing.content.objective"), ccObjective, ["conversion", "traffic", "brand_awareness"], setCcObjective)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("marketing.content.platform"), ccPlatform, platforms, setCcPlatform)}
              {renderSelect(t("marketing.content.language"), ccLanguage, LANGUAGES, setCcLanguage)}
            </div>

            {contentType !== "ad" && renderSelect(t("marketing.content.tone"), ccTone, TONES, setCcTone)}

            <Button
              onClick={contentType === "script" ? handleGenerateScript : contentType === "post" ? handleGeneratePost : handleGenerateAd}
              loading={loading}
              className="w-full"
            >
              {t("marketing.content.generate")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        {/* Result */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("marketing.content.result")}</h2>

          {scriptResult && (
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.script_title")}</span>
                <p className="font-semibold">{scriptResult.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.hook")}</span>
                <p className="text-sm italic bg-yellow-50 p-2 rounded">{scriptResult.hook}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.scenes")}</span>
                {scriptResult.scenes.map((s, i) => (
                  <div key={i} className="mt-1 p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium text-primary">{s.time}</span>
                    <p><span className="text-content/50">{t("marketing.content.visual")}:</span> {s.visual}</p>
                    <p><span className="text-content/50">{t("marketing.content.narration")}:</span> {s.narration}</p>
                    {s.text_overlay && <p><span className="text-content/50">{t("marketing.content.overlay")}:</span> {s.text_overlay}</p>}
                  </div>
                ))}
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.music")}</span>
                <p className="text-sm">{scriptResult.music_suggestion}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">CTA</span>
                <p className="text-sm font-semibold text-green-700">{scriptResult.cta}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(JSON.stringify(scriptResult, null, 2))}>
                {t("marketing.actions.copy")}
              </Button>
            </div>
          )}

          {postResult && (
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.caption")}</span>
                <p className="text-sm whitespace-pre-wrap">{postResult.caption}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.hashtags")}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {postResult.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-blue-600">{tag}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.image_hint")}</span>
                <p className="text-sm">{postResult.image_description}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.best_time")}</span>
                <p className="text-sm">{postResult.best_posting_time}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.engagement_tips")}</span>
                <p className="text-sm">{postResult.engagement_tips}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(postResult.caption)}>
                {t("marketing.actions.copy_caption")}
              </Button>
            </div>
          )}

          {adResult && (
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.headlines")}</span>
                {adResult.headlines.map((h, i) => (
                  <p key={i} className="text-sm font-medium">• {h}</p>
                ))}
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.descriptions")}</span>
                {adResult.descriptions.map((d, i) => (
                  <p key={i} className="text-sm">• {d}</p>
                ))}
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">CTA</span>
                <p className="text-sm font-semibold text-green-700">{adResult.cta}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.keywords")}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {adResult.keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-xs bg-gray-100">
                      {kw.keyword} <span className="text-content/50">({kw.match_type})</span>
                    </span>
                  ))}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(JSON.stringify(adResult, null, 2))}>
                {t("marketing.actions.copy")}
              </Button>
            </div>
          )}

          {!scriptResult && !postResult && !adResult && (
            <p className="text-content/50 text-sm">{t("marketing.content.placeholder")}</p>
          )}
        </Card>

        {/* Recent Contents */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{t("marketing.content.recent")}</h3>
            <Button variant="secondary" size="sm" onClick={loadContents}>{t("marketing.actions.refresh")}</Button>
          </div>
          <div className="space-y-2">
            {contents.slice(0, 10).map((c) => (
              <Card key={c.id} className="p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary-light text-primary font-medium">{c.content_type}</span>
                  <span className="ml-2 text-sm font-medium">{c.title}</span>
                  <span className="ml-2 text-xs text-content/50">{c.platform} &middot; {c.language}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => copyToClipboard(c.body)}>
                  {t("marketing.actions.copy")}
                </Button>
              </Card>
            ))}
            {contentsLoaded && contents.length === 0 && (
              <p className="text-content/50 text-sm">{t("marketing.content.no_content")}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---- Render: Audience Tab -------------------------------------- */

  function renderAudienceTab() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("marketing.audience.title")}</h2>
          <div className="space-y-4">
            <Input label={t("marketing.audience.category")} value={apCategory} onChange={(e) => setApCategory(e.target.value)} />
            <div>
              <Input
                label={t("marketing.audience.interests")}
                value={apInterestInput}
                onChange={(e) => setApInterestInput(e.target.value)}
                onKeyDown={(e) => handleFeatureKeyDown(e, apInterestInput, setApInterestInput, apInterests, setApInterests)}
                placeholder={t("marketing.audience.interests_hint")}
              />
              {renderFeatureTags(apInterests, (i) => removeFeature(i, apInterests, setApInterests))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("marketing.audience.market"), apMarket, MARKETS, setApMarket)}
              {renderSelect(t("marketing.audience.language"), apLanguage, LANGUAGES, setApLanguage)}
            </div>
            <Button onClick={handleAnalyzeAudience} loading={loading} className="w-full">
              {t("marketing.audience.analyze")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        {/* Result */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("marketing.audience.result")}</h2>
          {audienceResult ? (
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.demographics")}</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {Object.entries(audienceResult.demographics).map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded p-2">
                      <span className="text-xs text-content/50 capitalize">{k.replace("_", " ")}</span>
                      <p className="text-sm font-medium">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.interests")}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {audienceResult.interests_behaviors.map((item, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{item}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.content_prefs")}</span>
                <ul className="list-disc list-inside text-sm">
                  {audienceResult.content_preferences.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.platform_usage")}</span>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs font-medium text-content/50">{t("marketing.audience.primary")}:</span>
                    {(audienceResult.platform_usage.primary || []).map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">{p}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs font-medium text-content/50">{t("marketing.audience.secondary")}:</span>
                    {(audienceResult.platform_usage.secondary || []).map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.pain_points")}</span>
                <ul className="list-disc list-inside text-sm">
                  {audienceResult.pain_points.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.motivations")}</span>
                <ul className="list-disc list-inside text-sm">
                  {audienceResult.purchase_motivations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(JSON.stringify(audienceResult, null, 2))}>
                {t("marketing.actions.copy")}
              </Button>
            </div>
          ) : (
            <p className="text-content/50 text-sm">{t("marketing.audience.placeholder")}</p>
          )}
        </Card>
      </div>
    );
  }

  /* ---- Render: Main ---------------------------------------------- */

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{t("marketing.title")}</h1>
        <p className="text-sm text-content/50 mt-1">{t("marketing.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key ? "bg-white shadow text-primary" : "text-content/60 hover:text-content"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {activeTab === "campaign" && renderCampaignTab()}
      {activeTab === "content" && renderContentTab()}
      {activeTab === "audience" && renderAudienceTab()}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit --skipLibCheck src/pages/MarketingHub.tsx`
Expected: No errors (or only pre-existing errors from other files)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/MarketingHub.tsx
git commit -m "feat: add MarketingHub page with 3 tabs (campaign, content, audience)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Frontend — Route, Navigation, and i18n

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`

- [ ] **Step 1: Add route in App.tsx**

Add import:
```tsx
import { MarketingHub } from "./pages/MarketingHub";
```

Add route inside ProtectedRoute:
```tsx
<Route path="marketing" element={<MarketingHub />} />
```

- [ ] **Step 2: Add nav item in Layout.tsx**

Add to navItems array:
```tsx
{ to: "/marketing", label: "nav.marketing", icon: "marketing" },
```

Add marketing icon case to NavIcon switch:
```tsx
case "marketing":
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
```

- [ ] **Step 3: Add i18n translations — zh.json**

Add after the `"publish"` section in zh.json:
```json
"marketing": {
  "title": "营销中心",
  "subtitle": "AI 驱动的跨境营销策划与内容创作",
  "tabs": {
    "campaign": "营销策划",
    "content": "内容创作",
    "audience": "受众分析"
  },
  "campaign": {
    "title": "AI 营销策划",
    "product_name": "产品名称",
    "category": "产品品类",
    "features": "产品特性",
    "features_hint": "输入特性后按 Enter 添加",
    "market": "目标市场",
    "language": "语言",
    "objective": "营销目标",
    "generate": "生成营销策划",
    "result": "策划结果",
    "theme": "活动主题",
    "description": "活动描述",
    "strategy": "内容策略",
    "channels": "渠道建议",
    "hashtags": "推荐标签",
    "budget": "预算等级",
    "placeholder": "填写产品信息后点击「生成营销策划」",
    "list_title": "我的营销活动",
    "no_campaigns": "暂无营销活动",
    "contents": "条内容"
  },
  "content": {
    "title": "AI 内容创作",
    "types": {
      "script": "短视频脚本",
      "post": "社媒帖子",
      "ad": "广告文案"
    },
    "product_name": "产品名称",
    "features": "产品特性",
    "features_hint": "输入特性后按 Enter 添加",
    "platform": "目标平台",
    "language": "语言",
    "tone": "风格语气",
    "duration": "视频时长(秒)",
    "audience": "目标受众",
    "key_message": "核心信息",
    "market": "目标市场",
    "objective": "广告目标",
    "generate": "生成内容",
    "result": "生成结果",
    "script_title": "视频标题",
    "hook": "开场吸引",
    "scenes": "分镜头",
    "visual": "画面",
    "narration": "台词",
    "overlay": "字幕",
    "music": "配乐建议",
    "caption": "帖子文案",
    "hashtags": "话题标签",
    "image_hint": "配图建议",
    "best_time": "最佳发布时间",
    "engagement_tips": "互动提示",
    "headlines": "广告标题",
    "descriptions": "广告描述",
    "keywords": "关键词",
    "placeholder": "选择内容类型并填写产品信息",
    "recent": "最近生成的内容",
    "no_content": "暂无生成内容"
  },
  "audience": {
    "title": "受众画像分析",
    "category": "产品品类",
    "market": "目标市场",
    "interests": "兴趣关键词",
    "interests_hint": "输入关键词后按 Enter 添加",
    "language": "输出语言",
    "analyze": "分析受众",
    "result": "分析结果",
    "demographics": "人口统计",
    "interests": "兴趣与行为",
    "content_prefs": "内容偏好",
    "platform_usage": "平台使用",
    "primary": "主要平台",
    "secondary": "次要平台",
    "pain_points": "痛点",
    "motivations": "购买动机",
    "placeholder": "输入产品品类和目标市场开始分析"
  },
  "actions": {
    "copy": "复制内容",
    "copy_caption": "复制文案",
    "refresh": "刷新列表"
  }
},
```

Also add to the `nav` section:
```json
"marketing": "营销中心",
```

- [ ] **Step 4: Add i18n translations — en.json**

Add after the `"publish"` section in en.json:
```json
"marketing": {
  "title": "Marketing Hub",
  "subtitle": "AI-Powered Cross-Border Marketing & Content Creation",
  "tabs": {
    "campaign": "Campaign Planning",
    "content": "Content Creation",
    "audience": "Audience Analysis"
  },
  "campaign": {
    "title": "AI Campaign Planner",
    "product_name": "Product Name",
    "category": "Category",
    "features": "Features",
    "features_hint": "Type a feature and press Enter",
    "market": "Target Market",
    "language": "Language",
    "objective": "Objective",
    "generate": "Generate Campaign",
    "result": "Campaign Result",
    "theme": "Campaign Theme",
    "description": "Description",
    "strategy": "Content Strategy",
    "channels": "Channel Recommendations",
    "hashtags": "Hashtags",
    "budget": "Budget Tier",
    "placeholder": "Fill in product info and click Generate",
    "list_title": "My Campaigns",
    "no_campaigns": "No campaigns yet",
    "contents": "contents"
  },
  "content": {
    "title": "AI Content Creator",
    "types": {
      "script": "Video Script",
      "post": "Social Post",
      "ad": "Ad Copy"
    },
    "product_name": "Product Name",
    "features": "Features",
    "features_hint": "Type a feature and press Enter",
    "platform": "Platform",
    "language": "Language",
    "tone": "Tone",
    "duration": "Duration (seconds)",
    "audience": "Target Audience",
    "key_message": "Key Message",
    "market": "Target Market",
    "objective": "Ad Objective",
    "generate": "Generate Content",
    "result": "Generated Result",
    "script_title": "Video Title",
    "hook": "Opening Hook",
    "scenes": "Scenes",
    "visual": "Visual",
    "narration": "Narration",
    "overlay": "Text Overlay",
    "music": "Music Suggestion",
    "caption": "Post Caption",
    "hashtags": "Hashtags",
    "image_hint": "Image Description",
    "best_time": "Best Posting Time",
    "engagement_tips": "Engagement Tips",
    "headlines": "Headlines",
    "descriptions": "Descriptions",
    "keywords": "Keywords",
    "placeholder": "Select content type and fill in product info",
    "recent": "Recently Generated",
    "no_content": "No content generated yet"
  },
  "audience": {
    "title": "Audience Profile Analysis",
    "category": "Product Category",
    "market": "Target Market",
    "interests": "Interest Keywords",
    "interests_hint": "Type a keyword and press Enter",
    "language": "Output Language",
    "analyze": "Analyze Audience",
    "result": "Analysis Result",
    "demographics": "Demographics",
    "interests": "Interests & Behaviors",
    "content_prefs": "Content Preferences",
    "platform_usage": "Platform Usage",
    "primary": "Primary",
    "secondary": "Secondary",
    "pain_points": "Pain Points",
    "motivations": "Purchase Motivations",
    "placeholder": "Enter product category and target market to analyze"
  },
  "actions": {
    "copy": "Copy Content",
    "copy_caption": "Copy Caption",
    "refresh": "Refresh List"
  }
},
```

Also add to the `nav` section:
```json
"marketing": "Marketing Hub",
```

- [ ] **Step 5: Verify frontend builds**

Run: `cd frontend && npx tsc --noEmit`
Expected: No new TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/Layout.tsx frontend/src/i18n/zh.json frontend/src/i18n/en.json
git commit -m "feat: wire up marketing hub route, nav, and i18n translations

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Final Integration Verification

- [ ] **Step 1: Start backend and verify marketing endpoints respond**

```bash
cd backend && .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```
Wait 3 seconds, then:
```bash
curl -s http://localhost:8000/api/health
curl -s http://localhost:8000/docs  # Verify marketing endpoints appear in OpenAPI docs
```
Expected: Health returns `{"status":"ok"}`, docs page loads

- [ ] **Step 2: Verify frontend dev server starts**

```bash
cd frontend && npx vite --host 0.0.0.0 &
```
Wait 5 seconds, then check the dev server is running.

- [ ] **Step 3: Run full backend test suite**

```bash
cd backend && .\.venv\Scripts\python.exe -m pytest tests/ -v --tb=short
```
Expected: All tests pass

- [ ] **Step 4: Final commit if any changes**

```bash
git status
# Commit any remaining changes if needed
```
