# Market Research Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Market Research module from static mock-data shell to AI-powered analysis platform with trending product discovery, keyword research, and competitor analysis.

**Architecture:** Hybrid skill pattern (matching `marketing_skills`) + single `market_research_results` table. AI generation via DeepSeek API. REST API under `/api/market-research/`. Frontend refactors existing `MarketResearch.tsx` page.

**Tech Stack:** Python FastAPI, SQLAlchemy, DeepSeek API (via OpenAI SDK), React + TypeScript, Tailwind CSS, i18next

**Design Spec:** `docs/superpowers/specs/2026-06-06-market-research-design.md`

---

## File Structure Map

### Create (backend)
| File | Responsibility |
|------|---------------|
| `backend/app/models/market_research.py` | MarketResearchResult ORM model |
| `backend/app/schemas/market_research.py` | All Pydantic request/response schemas |
| `backend/app/services/market_research_skills/__init__.py` | Package exports |
| `backend/app/services/market_research_skills/base.py` | Abstract base classes + context/result dataclasses |
| `backend/app/services/market_research_skills/registry.py` | Skill provider registry |
| `backend/app/services/market_research_skills/trending_analyzer.py` | Trending products AI skill |
| `backend/app/services/market_research_skills/keyword_researcher.py` | Keyword research AI skill |
| `backend/app/services/market_research_skills/competitor_analyzer.py` | Competitor analysis AI skill |
| `backend/app/api/market_research.py` | API router (analysis + results CRUD) |
| `backend/tests/test_market_research.py` | API integration tests |

### Modify (backend)
| File | Change |
|------|--------|
| `backend/app/models/__init__.py` | Import MarketResearchResult |
| `backend/app/main.py` | Register market_research router |
| `backend/app/core/config.py` | Add market_research_provider setting |

### Modify (frontend)
| File | Change |
|------|--------|
| `frontend/src/pages/MarketResearch.tsx` | Full refactor from mock to AI-interactive |
| `frontend/src/i18n/zh.json` | Update market_research translations |
| `frontend/src/i18n/en.json` | Update market_research translations |

---

### Task 1: MarketResearchResult ORM Model

**Files:**
- Create: `backend/app/models/market_research.py`

- [ ] **Step 1: Create the model**

```python
# backend/app/models/market_research.py
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Float, ForeignKey, func, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class MarketResearchResult(Base):
    __tablename__ = "market_research_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    analysis_type: Mapped[str] = mapped_column(String(30), nullable=False)
    query_params: Mapped[dict] = mapped_column(JSON, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    platform: Mapped[str] = mapped_column(String(30), nullable=False)
    market: Mapped[str] = mapped_column(String(10), nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    credits_used: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
```

- [ ] **Step 2: Verify model imports**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.models.market_research import MarketResearchResult; print('Model OK')"`
Expected: "Model OK"

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/market_research.py
git commit -m "feat: add MarketResearchResult ORM model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Market Research Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/market_research.py`

- [ ] **Step 1: Create all Pydantic schemas**

```python
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
```

- [ ] **Step 2: Verify schemas import**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.schemas.market_research import TrendingAnalyzeRequest, ResearchResultResponse; print('Schemas OK')"`
Expected: "Schemas OK"

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/market_research.py
git commit -m "feat: add market research Pydantic schemas

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Market Research Skills — Base + Registry

**Files:**
- Create: `backend/app/services/market_research_skills/__init__.py`
- Create: `backend/app/services/market_research_skills/base.py`
- Create: `backend/app/services/market_research_skills/registry.py`

- [ ] **Step 1: Create base.py — Context/Result dataclasses + Abstract skill classes**

```python
# backend/app/services/market_research_skills/base.py
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


# ── Context dataclasses ────────────────────────────────

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


# ── Result dataclasses ─────────────────────────────────

@dataclass
class TrendingResult:
    title: str
    summary: str
    body: str  # markdown report
    structured_data: dict  # { products: [...] }


@dataclass
class KeywordResult:
    title: str
    summary: str
    body: str  # markdown report
    structured_data: dict  # { keywords: [...] }


@dataclass
class CompetitorResult:
    title: str
    summary: str
    body: str  # markdown report
    structured_data: dict  # { competitors: [...], differentiation_opportunities: [...] }


# ── Abstract Skill Classes ─────────────────────────────

class TrendingAnalyzerSkill(ABC):
    @abstractmethod
    async def analyze(self, ctx: TrendingContext) -> TrendingResult: ...


class KeywordResearcherSkill(ABC):
    @abstractmethod
    async def research(self, ctx: KeywordContext) -> KeywordResult: ...


class CompetitorAnalyzerSkill(ABC):
    @abstractmethod
    async def analyze(self, ctx: CompetitorContext) -> CompetitorResult: ...
```

- [ ] **Step 2: Create registry.py**

```python
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
```

- [ ] **Step 3: Create __init__.py**

```python
# backend/app/services/market_research_skills/__init__.py
from app.services.market_research_skills.base import (
    TrendingContext, KeywordContext, CompetitorContext,
    TrendingResult, KeywordResult, CompetitorResult,
    TrendingAnalyzerSkill, KeywordResearcherSkill, CompetitorAnalyzerSkill,
)
from app.services.market_research_skills.registry import (
    get_trending_analyzer, get_keyword_researcher, get_competitor_analyzer,
    list_available_skills,
)

__all__ = [
    "TrendingContext", "KeywordContext", "CompetitorContext",
    "TrendingResult", "KeywordResult", "CompetitorResult",
    "TrendingAnalyzerSkill", "KeywordResearcherSkill", "CompetitorAnalyzerSkill",
    "get_trending_analyzer", "get_keyword_researcher", "get_competitor_analyzer",
    "list_available_skills",
]
```

- [ ] **Step 4: Verify base imports**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.services.market_research_skills.base import TrendingContext, TrendingResult; print('Base OK')"`
Expected: "Base OK"

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/market_research_skills/
git commit -m "feat: add market research skills base classes and registry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Market Research Skills — 3 AI Implementations

**Files:**
- Create: `backend/app/services/market_research_skills/trending_analyzer.py`
- Create: `backend/app/services/market_research_skills/keyword_researcher.py`
- Create: `backend/app/services/market_research_skills/competitor_analyzer.py`

- [ ] **Step 1: Create trending analyzer**

```python
# backend/app/services/market_research_skills/trending_analyzer.py
import json
from app.services.market_research_skills.base import TrendingContext, TrendingResult, TrendingAnalyzerSkill
from app.services.deepseek import chat


class DeepSeekTrendingAnalyzer(TrendingAnalyzerSkill):
    async def analyze(self, ctx: TrendingContext) -> TrendingResult:
        system = (
            "You are a senior e-commerce market analyst. "
            "Analyze trending products in a given category and market. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        prompt = (
            f"Analyze trending products for:\n"
            f"Category: {ctx.category}\n"
            f"Market: {ctx.market}\n"
            f"Platform: {ctx.platform}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"title": "report title",\n'
            f' "summary": "one-line summary of key findings",\n'
            f' "body": "full markdown report with sections: Market Overview, Key Trends, Hot Subcategories, Recommendations",\n'
            f' "products": [{{"name": "...", "category": "...", "growth_pct": 150, "price_range": "$20-40", "platform": "{ctx.platform}", "rank": 1, "insight": "..."}}]}}\n\n'
            f"Provide 5-8 trending products with realistic growth percentages (50-400%) and meaningful insights."
        )

        result = chat(prompt, system, max_tokens=1200)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "title": f"Trending Products in {ctx.category} ({ctx.market})",
                "summary": f"Analysis of trending products in the {ctx.category} category for {ctx.market} market.",
                "body": result.strip()[:800],
                "products": [],
            }

        return TrendingResult(
            title=data.get("title", ""),
            summary=data.get("summary", ""),
            body=data.get("body", ""),
            structured_data={"products": data.get("products", [])},
        )
```

- [ ] **Step 2: Create keyword researcher**

```python
# backend/app/services/market_research_skills/keyword_researcher.py
import json
from app.services.market_research_skills.base import KeywordContext, KeywordResult, KeywordResearcherSkill
from app.services.deepseek import chat


class DeepSeekKeywordResearcher(KeywordResearcherSkill):
    async def research(self, ctx: KeywordContext) -> KeywordResult:
        system = (
            "You are an SEO and e-commerce keyword research specialist. "
            "Research high-potential keywords for product categories. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        seed_text = ", ".join(ctx.seed_keywords) if ctx.seed_keywords else "N/A"
        prompt = (
            f"Research keywords for:\n"
            f"Product Category: {ctx.product_category}\n"
            f"Seed Keywords: {seed_text}\n"
            f"Market: {ctx.market}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"title": "report title",\n'
            f' "summary": "one-line summary",\n'
            f' "body": "full markdown report with sections: Keyword Overview, High-Volume Keywords, Low-Competition Opportunities, Long-Tail Suggestions, Seasonal Trends",\n'
            f' "keywords": [{{"keyword": "eco friendly water bottle", "search_volume": "high", "competition": "medium", "relevance": 0.95, "suggested_bid": "$0.50"}}]}}\n\n'
            f"Provide 8-12 keywords with realistic search volume (high/medium/low), competition (high/medium/low), relevance (0.0-1.0), and suggested PPC bids."
        )

        result = chat(prompt, system, max_tokens=1000)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "title": f"Keyword Research: {ctx.product_category} ({ctx.market})",
                "summary": f"Keyword analysis for {ctx.product_category} in {ctx.market}.",
                "body": result.strip()[:800],
                "keywords": [],
            }

        return KeywordResult(
            title=data.get("title", ""),
            summary=data.get("summary", ""),
            body=data.get("body", ""),
            structured_data={"keywords": data.get("keywords", [])},
        )
```

- [ ] **Step 3: Create competitor analyzer**

```python
# backend/app/services/market_research_skills/competitor_analyzer.py
import json
from app.services.market_research_skills.base import CompetitorContext, CompetitorResult, CompetitorAnalyzerSkill
from app.services.deepseek import chat


class DeepSeekCompetitorAnalyzer(CompetitorAnalyzerSkill):
    async def analyze(self, ctx: CompetitorContext) -> CompetitorResult:
        system = (
            "You are a competitive intelligence analyst for e-commerce. "
            "Analyze competitors and identify differentiation opportunities. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        prompt = (
            f"Analyze competitors for:\n"
            f"Product: {ctx.product_name}\n"
            f"Features: {features_text}\n"
            f"Market: {ctx.market}\n"
            f"Platform: {ctx.platform}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"title": "report title",\n'
            f' "summary": "one-line competitive landscape summary",\n'
            f' "body": "full markdown report with sections: Competitive Landscape, Top Competitors, Pricing Analysis, Market Positioning, Recommendations",\n'
            f' "competitors": [{{"name": "...", "price": "$X", "rating": 4.3, "strengths": ["..."], "weaknesses": ["..."], "strategy": "..."}}],\n'
            f' "differentiation_opportunities": ["opportunity 1", "opportunity 2", ...],\n'
            f' "pricing_advice": "suggested pricing strategy"}}\n\n'
            f"Provide 4-6 competitors with realistic data and actionable differentiation opportunities."
        )

        result = chat(prompt, system, max_tokens=1200)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "title": f"Competitor Analysis: {ctx.product_name} ({ctx.market})",
                "summary": f"Competitive analysis for {ctx.product_name} in {ctx.market}.",
                "body": result.strip()[:800],
                "competitors": [],
                "differentiation_opportunities": [],
                "pricing_advice": "",
            }

        return CompetitorResult(
            title=data.get("title", ""),
            summary=data.get("summary", ""),
            body=data.get("body", ""),
            structured_data={
                "competitors": data.get("competitors", []),
                "differentiation_opportunities": data.get("differentiation_opportunities", []),
                "pricing_advice": data.get("pricing_advice", ""),
            },
        )
```

- [ ] **Step 4: Verify all skills import**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.services.market_research_skills.registry import get_trending_analyzer, get_keyword_researcher, get_competitor_analyzer; print('All skills OK')"`
Expected: "All skills OK"

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/market_research_skills/trending_analyzer.py backend/app/services/market_research_skills/keyword_researcher.py backend/app/services/market_research_skills/competitor_analyzer.py
git commit -m "feat: add 3 market research AI skills (trending, keywords, competitors)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Market Research API Router

**Files:**
- Create: `backend/app/api/market_research.py`

- [ ] **Step 1: Create the complete API router**

```python
# backend/app/api/market_research.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.market_research import MarketResearchResult
from app.services.market_research_skills.registry import (
    get_trending_analyzer,
    get_keyword_researcher,
    get_competitor_analyzer,
    list_available_skills,
)
from app.services.market_research_skills.base import (
    TrendingContext, KeywordContext, CompetitorContext,
)
from app.services.usage import deduct_credits
from app.schemas.market_research import (
    TrendingAnalyzeRequest, TrendingAnalyzeResponse,
    KeywordResearchRequest, KeywordResearchResponse,
    CompetitorAnalyzeRequest, CompetitorAnalyzeResponse,
    ResearchResultResponse, ResearchResultListResponse,
)

router = APIRouter()

# ── Helpers ────────────────────────────────────────────

def _save_result(
    db: Session, user_id: str, analysis_type: str,
    query_params: dict, title: str, body: str, summary: str,
    platform: str, market: str, structured_data: dict | None,
    credits_used: float,
) -> MarketResearchResult:
    result = MarketResearchResult(
        user_id=user_id,
        analysis_type=analysis_type,
        query_params=query_params,
        title=title,
        body=body,
        summary=summary,
        platform=platform,
        market=market,
        metadata_=structured_data,
        credits_used=credits_used,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def _to_response(r: MarketResearchResult) -> ResearchResultResponse:
    return ResearchResultResponse(
        id=r.id,
        analysis_type=r.analysis_type,
        title=r.title,
        summary=r.summary,
        body=r.body,
        structured_data=r.metadata_,
        market=r.market,
        platform=r.platform,
        credits_used=r.credits_used,
        created_at=r.created_at,
    )


# ── AI Analysis Endpoints ──────────────────────────────

@router.get("/skills")
async def list_skills():
    return list_available_skills()


@router.post("/analyze-trending", response_model=TrendingAnalyzeResponse)
async def analyze_trending(
    req: TrendingAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = TrendingContext(
        category=req.category,
        market=req.market,
        platform=req.platform,
        language=req.language,
    )
    skill = get_trending_analyzer()
    try:
        result = await skill.analyze(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI analysis failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=2.0, api_cost=0.008)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    saved = _save_result(
        db, current_user.id, "trending",
        {"category": req.category, "market": req.market, "platform": req.platform},
        result.title, result.body, result.summary,
        req.platform, req.market, result.structured_data, 2.0,
    )

    return TrendingAnalyzeResponse(result=_to_response(saved), credits_used=2.0)


@router.post("/analyze-keywords", response_model=KeywordResearchResponse)
async def analyze_keywords(
    req: KeywordResearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = KeywordContext(
        product_category=req.product_category,
        seed_keywords=req.seed_keywords,
        market=req.market,
        language=req.language,
    )
    skill = get_keyword_researcher()
    try:
        result = await skill.research(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI analysis failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=1.5, api_cost=0.006)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    saved = _save_result(
        db, current_user.id, "keywords",
        {"product_category": req.product_category, "seed_keywords": req.seed_keywords, "market": req.market},
        result.title, result.body, result.summary,
        "all", req.market, result.structured_data, 1.5,
    )

    return KeywordResearchResponse(result=_to_response(saved), credits_used=1.5)


@router.post("/analyze-competitors", response_model=CompetitorAnalyzeResponse)
async def analyze_competitors(
    req: CompetitorAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = CompetitorContext(
        product_name=req.product_name,
        features=req.product_features,
        market=req.market,
        platform=req.platform,
        language=req.language,
    )
    skill = get_competitor_analyzer()
    try:
        result = await skill.analyze(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI analysis failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=2.0, api_cost=0.008)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    saved = _save_result(
        db, current_user.id, "competitors",
        {"product_name": req.product_name, "features": req.product_features, "market": req.market, "platform": req.platform},
        result.title, result.body, result.summary,
        req.platform, req.market, result.structured_data, 2.0,
    )

    return CompetitorAnalyzeResponse(result=_to_response(saved), credits_used=2.0)


# ── Results CRUD ───────────────────────────────────────

@router.get("/results", response_model=ResearchResultListResponse)
async def list_results(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    analysis_type: str | None = Query(None),
):
    q = db.query(MarketResearchResult).filter_by(user_id=current_user.id)
    if analysis_type:
        q = q.filter_by(analysis_type=analysis_type)
    results = q.order_by(MarketResearchResult.created_at.desc()).all()
    return ResearchResultListResponse(
        results=[_to_response(r) for r in results],
        total=len(results),
    )


@router.get("/results/{result_id}", response_model=ResearchResultResponse)
async def get_result(
    result_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.query(MarketResearchResult).filter_by(id=result_id, user_id=current_user.id).first()
    if not result:
        raise HTTPException(404, "Result not found")
    return _to_response(result)


@router.delete("/results/{result_id}")
async def delete_result(
    result_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.query(MarketResearchResult).filter_by(id=result_id, user_id=current_user.id).first()
    if not result:
        raise HTTPException(404, "Result not found")
    db.delete(result)
    db.commit()
    return {"status": "deleted"}
```

- [ ] **Step 2: Verify router imports**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.api.market_research import router; print('Router OK')"`
Expected: "Router OK"

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/market_research.py
git commit -m "feat: add market research API router with AI analysis and results CRUD

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Wire Up Router + Model + Config

**Files:**
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/core/config.py`

- [ ] **Step 1: Add model import in models/__init__.py**

Add after existing imports:
```python
from app.models.market_research import MarketResearchResult
```

Add to `__all__`:
```python
"MarketResearchResult",
```

- [ ] **Step 2: Register router in main.py**

Add import:
```python
from app.api.market_research import router as market_research_router
```

Add router registration:
```python
app.include_router(market_research_router, prefix="/api/market-research", tags=["market-research"])
```

- [ ] **Step 3: Add config setting**

Add after `marketing_provider`:
```python
    # Market Research
    market_research_provider: str = "deepseek"  # "deepseek" or future providers
```

- [ ] **Step 4: Verify app loads**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.main import app; routes = [r.path for r in app.routes if hasattr(r, 'path')]; mr = [r for r in routes if 'market-research' in r]; print(f'Market research routes: {len(mr)}')"`
Expected: "Market research routes: 6" or similar

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/__init__.py backend/app/main.py backend/app/core/config.py
git commit -m "feat: register market research router, model, and config

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Backend Tests

**Files:**
- Create: `backend/tests/test_market_research.py`

- [ ] **Step 1: Create test file**

```python
# backend/tests/test_market_research.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///./test_market_research.db"
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
TEST_TOKEN = None


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def get_auth_headers():
    global TEST_TOKEN
    if TEST_TOKEN:
        return {"Authorization": f"Bearer {TEST_TOKEN}"}

    resp = client.post("/api/auth/register", json={
        "phone": "+8613800000010",
        "password": "test123456",
        "code": "000000",
    })
    if resp.status_code == 201:
        data = resp.json()
        TEST_TOKEN = data.get("access_token")
    elif resp.status_code == 409:
        # Send code first, then login
        client.post("/api/auth/send-code", json={"phone": "+8613800000010"})
        resp = client.post("/api/auth/login", json={
            "phone": "+8613800000010",
            "password": "test123456",
        })
        data = resp.json()
        TEST_TOKEN = data.get("access_token")

    return {"Authorization": f"Bearer {TEST_TOKEN}"} if TEST_TOKEN else {}


class TestMarketResearchSkills:
    def test_list_skills(self):
        headers = get_auth_headers()
        resp = client.get("/api/market-research/skills", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "trending_analyzer" in data
        assert "keyword_researcher" in data
        assert "competitor_analyzer" in data


class TestResultsCRUD:
    def test_list_results_empty(self):
        headers = get_auth_headers()
        resp = client.get("/api/market-research/results", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data
        assert "total" in data

    def test_filter_results_by_type(self):
        headers = get_auth_headers()
        resp = client.get("/api/market-research/results?analysis_type=trending", headers=headers)
        assert resp.status_code == 200


class TestAuthRequired:
    def test_analyze_requires_auth(self):
        resp = client.post("/api/market-research/analyze-trending", json={
            "category": "Electronics",
            "market": "US",
        })
        assert resp.status_code == 403

    def test_results_require_auth(self):
        resp = client.get("/api/market-research/results")
        assert resp.status_code == 403
```

- [ ] **Step 2: Run tests**

Run: `cd backend && .\.venv\Scripts\python.exe -m pytest tests/test_market_research.py -v --tb=short`
Expected: All tests pass (CRUD and auth tests; AI analysis tests may need API key)

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_market_research.py
git commit -m "test: add market research API integration tests

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Frontend — Refactor MarketResearch.tsx

**Files:**
- Modify: `frontend/src/pages/MarketResearch.tsx` (full rewrite)

- [ ] **Step 1: Rewrite MarketResearch.tsx**

```tsx
// frontend/src/pages/MarketResearch.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { apiFetch } from "../lib/api";

type TabKey = "trending" | "keywords" | "competitors";

interface ResearchResult {
  id: string;
  analysis_type: string;
  title: string;
  summary: string;
  body: string;
  structured_data: Record<string, any> | null;
  market: string;
  platform: string;
  credits_used: number;
  created_at: string;
}

const MARKETS = ["US", "UK", "DE", "JP"];
const LANGUAGES = ["en", "zh", "de", "ja"];
const PLATFORMS = ["amazon", "ebay", "tiktok_shop", "all"];

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: "trending", labelKey: "market_research.tabs.trending" },
  { key: "keywords", labelKey: "market_research.tabs.keywords" },
  { key: "competitors", labelKey: "market_research.tabs.competitors" },
];

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
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </div>
  );
}

function MarkdownBody({ body }: { body: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-content/80"
      dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, "<br/>").replace(/## (.+)/g, "<h3 class='text-lg font-semibold mt-4 mb-2'>$1</h3>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
    />
  );
}

export function MarketResearch() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("trending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- Trending State ---- */
  const [trCategory, setTrCategory] = useState("");
  const [trMarket, setTrMarket] = useState("US");
  const [trPlatform, setTrPlatform] = useState("amazon");
  const [trLanguage, setTrLanguage] = useState("en");
  const [trendingResult, setTrendingResult] = useState<ResearchResult | null>(null);

  /* ---- Keywords State ---- */
  const [kwCategory, setKwCategory] = useState("");
  const [kwSeeds, setKwSeeds] = useState<string[]>([]);
  const [kwSeedInput, setKwSeedInput] = useState("");
  const [kwMarket, setKwMarket] = useState("US");
  const [kwLanguage, setKwLanguage] = useState("en");
  const [keywordResult, setKeywordResult] = useState<ResearchResult | null>(null);

  /* ---- Competitors State ---- */
  const [cpName, setCpName] = useState("");
  const [cpFeatures, setCpFeatures] = useState<string[]>([]);
  const [cpFeatureInput, setCpFeatureInput] = useState("");
  const [cpMarket, setCpMarket] = useState("US");
  const [cpPlatform, setCpPlatform] = useState("amazon");
  const [cpLanguage, setCpLanguage] = useState("en");
  const [competitorResult, setCompetitorResult] = useState<ResearchResult | null>(null);

  /* ---- History ---- */
  const [history, setHistory] = useState<ResearchResult[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyTab, setHistoryTab] = useState<TabKey>("trending");

  // Read keywords from Copy Factory link
  const linkedKeywords = searchParams.get("keywords");
  const initialKeywords = linkedKeywords ? linkedKeywords.split(",") : [];

  /* ---- Handlers ---- */

  async function handleAnalyzeTrending() {
    if (!trCategory) return;
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<{ result: ResearchResult }>("/api/market-research/analyze-trending", {
        method: "POST",
        body: JSON.stringify({ category: trCategory, market: trMarket, platform: trPlatform, language: trLanguage }),
      });
      setTrendingResult(data.result);
    } catch (e: any) { setError(e.message || "Analysis failed"); }
    finally { setLoading(false); }
  }

  async function handleAnalyzeKeywords() {
    if (!kwCategory) return;
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<{ result: ResearchResult }>("/api/market-research/analyze-keywords", {
        method: "POST",
        body: JSON.stringify({ product_category: kwCategory, seed_keywords: kwSeeds, market: kwMarket, language: kwLanguage }),
      });
      setKeywordResult(data.result);
    } catch (e: any) { setError(e.message || "Analysis failed"); }
    finally { setLoading(false); }
  }

  async function handleAnalyzeCompetitors() {
    if (!cpName) return;
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<{ result: ResearchResult }>("/api/market-research/analyze-competitors", {
        method: "POST",
        body: JSON.stringify({ product_name: cpName, product_features: cpFeatures, market: cpMarket, platform: cpPlatform, language: cpLanguage }),
      });
      setCompetitorResult(data.result);
    } catch (e: any) { setError(e.message || "Analysis failed"); }
    finally { setLoading(false); }
  }

  async function loadHistory(type: TabKey) {
    setHistoryTab(type);
    try {
      const data = await apiFetch<{ results: ResearchResult[] }>(`/api/market-research/results?analysis_type=${type}`);
      setHistory(data.results);
      setHistoryLoaded(true);
    } catch { /* ignore */ }
  }

  function handleFeatureKeyDown(e: React.KeyboardEvent<HTMLInputElement>, current: string, setter: (v: string) => void, list: string[], listSetter: (v: string[]) => void) {
    if (e.key === "Enter" && current.trim()) {
      e.preventDefault();
      listSetter([...list, current.trim()]);
      setter("");
    }
  }

  function removeFeature(idx: number, list: string[], listSetter: (v: string[]) => void) {
    listSetter(list.filter((_, i) => i !== idx));
  }

  /* ---- Render: Trending Tab ---- */

  function renderTrendingTab() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.trending.title")}</h2>
          <div className="space-y-4">
            <Input label={t("market_research.trending.category")} value={trCategory} onChange={(e) => setTrCategory(e.target.value)} placeholder="e.g. Electronics, Home & Kitchen" />
            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("market_research.trending.market"), trMarket, MARKETS, setTrMarket)}
              {renderSelect(t("market_research.trending.platform"), trPlatform, PLATFORMS, setTrPlatform)}
            </div>
            {renderSelect(t("market_research.trending.language"), trLanguage, LANGUAGES, setTrLanguage)}
            <Button onClick={handleAnalyzeTrending} loading={loading} className="w-full">
              {t("market_research.trending.analyze")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.trending.result")}</h2>
          {trendingResult ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-primary">{trendingResult.title}</h3>
                <p className="text-sm text-content/60">{trendingResult.summary}</p>
              </div>
              {trendingResult.structured_data?.products && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-edge">
                        <th className="text-left py-2 px-1 font-medium text-content/70">#</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.trending.product")}</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.trending.growth")}</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.trending.price")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trendingResult.structured_data.products.map((p: any, i: number) => (
                        <tr key={i} className="border-b border-edge/50">
                          <td className="py-2 px-1 font-bold text-content/50">{p.rank || i + 1}</td>
                          <td className="py-2 px-1">
                            <span className="font-medium">{p.name}</span>
                            <p className="text-xs text-content/50">{p.insight}</p>
                          </td>
                          <td className="py-2 px-1 text-green-600 font-medium">+{p.growth_pct}%</td>
                          <td className="py-2 px-1 text-content/70">{p.price_range}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <MarkdownBody body={trendingResult.body} />
            </div>
          ) : (
            <p className="text-content/50 text-sm">{t("market_research.trending.placeholder")}</p>
          )}
        </Card>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{t("market_research.history")}</h3>
            <Button variant="secondary" size="sm" onClick={() => loadHistory("trending")}>{t("market_research.actions.refresh")}</Button>
          </div>
          <div className="space-y-2">
            {history.filter(h => h.analysis_type === "trending").slice(0, 5).map((h) => (
              <Card key={h.id} className="p-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{h.title}</span>
                  <span className="ml-2 text-xs text-content/50">{new Date(h.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---- Render: Keywords Tab ---- */

  function renderKeywordsTab() {
    const allKeywords = keywordResult?.structured_data?.keywords || [];
    const keywordList = allKeywords.map((k: any) => k.keyword).join(",");

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.keywords.title")}</h2>
          <div className="space-y-4">
            <Input label={t("market_research.keywords.category")} value={kwCategory} onChange={(e) => setKwCategory(e.target.value)} />
            <div>
              <Input
                label={t("market_research.keywords.seeds")}
                value={kwSeedInput}
                onChange={(e) => setKwSeedInput(e.target.value)}
                onKeyDown={(e) => handleFeatureKeyDown(e, kwSeedInput, setKwSeedInput, kwSeeds, setKwSeeds)}
                placeholder={t("market_research.keywords.seeds_hint")}
              />
              {renderFeatureTags(kwSeeds, (i) => removeFeature(i, kwSeeds, setKwSeeds))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("market_research.keywords.market"), kwMarket, MARKETS, setKwMarket)}
              {renderSelect(t("market_research.keywords.language"), kwLanguage, LANGUAGES, setKwLanguage)}
            </div>
            <Button onClick={handleAnalyzeKeywords} loading={loading} className="w-full">
              {t("market_research.keywords.analyze")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.keywords.result")}</h2>
          {keywordResult ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-primary">{keywordResult.title}</h3>
                <p className="text-sm text-content/60">{keywordResult.summary}</p>
              </div>
              {allKeywords.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-edge">
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.keywords.keyword")}</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.keywords.volume")}</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.keywords.competition")}</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.keywords.relevance")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allKeywords.map((kw: any, i: number) => (
                        <tr key={i} className="border-b border-edge/50">
                          <td className="py-2 px-1 font-medium">{kw.keyword}</td>
                          <td className="py-2 px-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${kw.search_volume === "high" ? "bg-green-100 text-green-800" : kw.search_volume === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}`}>{kw.search_volume}</span>
                          </td>
                          <td className="py-2 px-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${kw.competition === "low" ? "bg-green-100 text-green-800" : kw.competition === "high" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{kw.competition}</span>
                          </td>
                          <td className="py-2 px-1">{(kw.relevance * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {keywordList && (
                <Button variant="secondary" size="sm" onClick={() => window.location.href = `/copy-factory?keywords=${encodeURIComponent(keywordList)}`}>
                  {t("market_research.keywords.use_in_copy_factory")}
                </Button>
              )}
              <MarkdownBody body={keywordResult.body} />
            </div>
          ) : (
            <p className="text-content/50 text-sm">{t("market_research.keywords.placeholder")}</p>
          )}
        </Card>
      </div>
    );
  }

  /* ---- Render: Competitors Tab ---- */

  function renderCompetitorsTab() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.competitors.title")}</h2>
          <div className="space-y-4">
            <Input label={t("market_research.competitors.product_name")} value={cpName} onChange={(e) => setCpName(e.target.value)} />
            <div>
              <Input
                label={t("market_research.competitors.features")}
                value={cpFeatureInput}
                onChange={(e) => setCpFeatureInput(e.target.value)}
                onKeyDown={(e) => handleFeatureKeyDown(e, cpFeatureInput, setCpFeatureInput, cpFeatures, setCpFeatures)}
                placeholder={t("market_research.competitors.features_hint")}
              />
              {renderFeatureTags(cpFeatures, (i) => removeFeature(i, cpFeatures, setCpFeatures))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("market_research.competitors.market"), cpMarket, MARKETS, setCpMarket)}
              {renderSelect(t("market_research.competitors.platform"), cpPlatform, PLATFORMS, setCpPlatform)}
            </div>
            {renderSelect(t("market_research.competitors.language"), cpLanguage, LANGUAGES, setCpLanguage)}
            <Button onClick={handleAnalyzeCompetitors} loading={loading} className="w-full">
              {t("market_research.competitors.analyze")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.competitors.result")}</h2>
          {competitorResult ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-primary">{competitorResult.title}</h3>
                <p className="text-sm text-content/60">{competitorResult.summary}</p>
              </div>
              {competitorResult.structured_data?.competitors && (
                <div className="space-y-3">
                  {competitorResult.structured_data.competitors.map((c: any, i: number) => (
                    <Card key={i} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-sm text-content/60">{c.price} &middot; ★{c.rating}</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <p><span className="text-green-600 font-medium">Strengths:</span> {c.strengths?.join(", ")}</p>
                        <p><span className="text-red-600 font-medium">Weaknesses:</span> {c.weaknesses?.join(", ")}</p>
                        <p className="text-content/50">{c.strategy}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              {competitorResult.structured_data?.differentiation_opportunities && (
                <div>
                  <span className="text-sm font-medium text-content/70">{t("market_research.competitors.opportunities")}</span>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {competitorResult.structured_data.differentiation_opportunities.map((o: string, i: number) => (
                      <li key={i} className="text-green-700">{o}</li>
                    ))}
                  </ul>
                </div>
              )}
              {competitorResult.structured_data?.pricing_advice && (
                <div>
                  <span className="text-sm font-medium text-content/70">{t("market_research.competitors.pricing")}</span>
                  <p className="text-sm mt-1">{competitorResult.structured_data.pricing_advice}</p>
                </div>
              )}
              <MarkdownBody body={competitorResult.body} />
            </div>
          ) : (
            <p className="text-content/50 text-sm">{t("market_research.competitors.placeholder")}</p>
          )}
        </Card>
      </div>
    );
  }

  /* ---- Render: Main ---- */

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{t("market_research.title")}</h1>
        <p className="text-sm text-content/50 mt-1">{t("market_research.subtitle")}</p>
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

      {activeTab === "trending" && renderTrendingTab()}
      {activeTab === "keywords" && renderKeywordsTab()}
      {activeTab === "competitors" && renderCompetitorsTab()}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit --skipLibCheck src/pages/MarketResearch.tsx`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/MarketResearch.tsx
git commit -m "feat: refactor MarketResearch page from mock to AI-interactive

- 3 tabs all functional: trending products, keyword research, competitor analysis
- AI analysis via market-research API endpoints
- Structured data rendering (product tables, keyword tables, competitor cards)
- Keyword → Copy Factory cross-link via URL params
- History section for recent results

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Frontend i18n Updates

**Files:**
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`

- [ ] **Step 1: Update zh.json**

Replace the `"nav"` section entry for market_research and add the full market_research translations. In the `nav` object, ensure:
```json
"market_research": "市场研究",
```

Add a new top-level key `"market_research"`:
```json
"market_research": {
  "title": "市场研究",
  "subtitle": "AI 驱动的选品分析与市场洞察",
  "tabs": {
    "trending": "爆款选品",
    "keywords": "关键词研究",
    "competitors": "竞品分析"
  },
  "trending": {
    "title": "AI 爆款选品分析",
    "category": "产品品类",
    "market": "目标市场",
    "platform": "平台",
    "language": "语言",
    "analyze": "AI 分析趋势",
    "result": "分析结果",
    "product": "产品",
    "growth": "增长",
    "price": "价格区间",
    "placeholder": "输入品类后点击分析"
  },
  "keywords": {
    "title": "AI 关键词研究",
    "category": "产品品类",
    "seeds": "种子关键词",
    "seeds_hint": "输入关键词后按 Enter 添加",
    "market": "目标市场",
    "language": "语言",
    "analyze": "AI 分析关键词",
    "result": "研究结果",
    "keyword": "关键词",
    "volume": "搜索量",
    "competition": "竞争度",
    "relevance": "相关性",
    "use_in_copy_factory": "用于文案工厂",
    "placeholder": "输入品类后点击分析"
  },
  "competitors": {
    "title": "AI 竞品分析",
    "product_name": "产品名称",
    "features": "产品特性",
    "features_hint": "输入特性后按 Enter 添加",
    "market": "目标市场",
    "platform": "平台",
    "language": "语言",
    "analyze": "AI 分析竞品",
    "result": "分析结果",
    "opportunities": "差异化机会",
    "pricing": "定价建议",
    "placeholder": "输入产品信息后点击分析"
  },
  "history": "历史分析",
  "actions": {
    "refresh": "刷新"
  }
}
```

- [ ] **Step 2: Update en.json**

Same structure with English values:
```json
"market_research": {
  "title": "Market Research",
  "subtitle": "AI-Powered Product Selection & Market Insights",
  "tabs": {
    "trending": "Trending Products",
    "keywords": "Keyword Research",
    "competitors": "Competitor Analysis"
  },
  "trending": {
    "title": "AI Trending Product Analysis",
    "category": "Product Category",
    "market": "Target Market",
    "platform": "Platform",
    "language": "Language",
    "analyze": "Analyze Trends",
    "result": "Analysis Result",
    "product": "Product",
    "growth": "Growth",
    "price": "Price Range",
    "placeholder": "Enter a category and click analyze"
  },
  "keywords": {
    "title": "AI Keyword Research",
    "category": "Product Category",
    "seeds": "Seed Keywords",
    "seeds_hint": "Type a keyword and press Enter",
    "market": "Target Market",
    "language": "Language",
    "analyze": "Analyze Keywords",
    "result": "Research Result",
    "keyword": "Keyword",
    "volume": "Volume",
    "competition": "Competition",
    "relevance": "Relevance",
    "use_in_copy_factory": "Use in Copy Factory",
    "placeholder": "Enter a category and click analyze"
  },
  "competitors": {
    "title": "AI Competitor Analysis",
    "product_name": "Product Name",
    "features": "Features",
    "features_hint": "Type a feature and press Enter",
    "market": "Target Market",
    "platform": "Platform",
    "language": "Language",
    "analyze": "Analyze Competitors",
    "result": "Analysis Result",
    "opportunities": "Differentiation Opportunities",
    "pricing": "Pricing Advice",
    "placeholder": "Enter product info and click analyze"
  },
  "history": "Research History",
  "actions": {
    "refresh": "Refresh"
  }
}
```

- [ ] **Step 3: Verify JSON valid and TypeScript compiles**

Run: `cd frontend && node -e "JSON.parse(require('fs').readFileSync('src/i18n/zh.json','utf8')); JSON.parse(require('fs').readFileSync('src/i18n/en.json','utf8')); console.log('JSON OK')"`
Run: `cd frontend && npx tsc --noEmit 2>&1 | Select-String "error" | Select-Object -First 5`
Expected: "JSON OK" and no TS errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/i18n/zh.json frontend/src/i18n/en.json
git commit -m "feat: add market research i18n translations (zh/en)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Final Integration Verification

- [ ] **Step 1: Run backend test suite**

Run: `cd backend && .\.venv\Scripts\python.exe -m pytest tests/test_market_research.py -v --tb=short`
Expected: All tests pass

- [ ] **Step 2: Verify all market-research routes registered**

Run: `cd backend && .\.venv\Scripts\python.exe -c "from app.main import app; routes = [(r.path, list(r.methods)) for r in app.routes if hasattr(r, 'path') and hasattr(r, 'methods')]; mr = [(p,m) for p,m in routes if 'market-research' in p]; [print(f'  {m[0]:6s} {p}') for p,m in sorted(mr)]"`
Expected: 6+ routes listed

- [ ] **Step 3: Frontend TypeScript check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 4: Final commit if needed**

```bash
git status
```
