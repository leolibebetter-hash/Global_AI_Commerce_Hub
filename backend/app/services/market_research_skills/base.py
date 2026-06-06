# backend/app/services/market_research_skills/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class TrendingContext:
    category: str
    market: str = "US"
    platform: str = "amazon"
    language: str = "en"


@dataclass
class KeywordContext:
    product_category: str
    seed_keywords: list[str] = field(default_factory=list)
    market: str = "US"
    language: str = "en"


@dataclass
class CompetitorContext:
    product_name: str
    features: list[str] = field(default_factory=list)
    market: str = "US"
    platform: str = "amazon"
    language: str = "en"


@dataclass
class TrendingResult:
    title: str
    summary: str
    body: str
    structured_data: dict


@dataclass
class KeywordResult:
    title: str
    summary: str
    body: str
    structured_data: dict


@dataclass
class CompetitorResult:
    title: str
    summary: str
    body: str
    structured_data: dict


class TrendingAnalyzerSkill(ABC):
    @abstractmethod
    async def analyze(self, ctx: TrendingContext) -> TrendingResult: ...


class KeywordResearcherSkill(ABC):
    @abstractmethod
    async def research(self, ctx: KeywordContext) -> KeywordResult: ...


class CompetitorAnalyzerSkill(ABC):
    @abstractmethod
    async def analyze(self, ctx: CompetitorContext) -> CompetitorResult: ...
