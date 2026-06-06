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
