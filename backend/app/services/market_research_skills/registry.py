# backend/app/services/market_research_skills/registry.py
from app.core.config import settings
from app.services.market_research_skills.base import (
    TrendingAnalyzerSkill,
    KeywordResearcherSkill,
    CompetitorAnalyzerSkill,
)


def _provider() -> str:
    return getattr(settings, "market_research_provider", "deepseek") or "deepseek"


def get_trending_analyzer(provider: str | None = None) -> TrendingAnalyzerSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.market_research_skills.trending_analyzer import DeepSeekTrendingAnalyzer
        return DeepSeekTrendingAnalyzer()
    raise ValueError(f"Unknown trending analyzer provider: {provider}")


def get_keyword_researcher(provider: str | None = None) -> KeywordResearcherSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.market_research_skills.keyword_researcher import DeepSeekKeywordResearcher
        return DeepSeekKeywordResearcher()
    raise ValueError(f"Unknown keyword researcher provider: {provider}")


def get_competitor_analyzer(provider: str | None = None) -> CompetitorAnalyzerSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.market_research_skills.competitor_analyzer import DeepSeekCompetitorAnalyzer
        return DeepSeekCompetitorAnalyzer()
    raise ValueError(f"Unknown competitor analyzer provider: {provider}")


def list_available_skills() -> dict:
    return {
        "trending_analyzer": ["deepseek"],
        "keyword_researcher": ["deepseek"],
        "competitor_analyzer": ["deepseek"],
    }
