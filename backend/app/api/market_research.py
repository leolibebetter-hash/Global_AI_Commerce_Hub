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
