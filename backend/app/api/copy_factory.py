import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.copy_skills.registry import (
    get_title_skill,
    get_bullet_skill,
    get_description_skill,
    get_keyword_skill,
    list_available_skills,
)
from app.services.copy_skills.base import ProductContext
from app.services.usage import deduct_credits
from app.schemas.product import (
    ProductContextRequest,
    CopyGenerateRequest,
    CopyGenerateResponse,
    TitleResponse,
    BulletResponse,
    DescriptionResponse,
    KeywordListResponse,
    KeywordItem,
    OptimizeRequest,
)

router = APIRouter()


def _to_context(req: ProductContextRequest) -> ProductContext:
    return ProductContext(
        product_name=req.product_name,
        category=req.category,
        features=req.features,
        target_market=req.target_market,
        language=req.language,
        keywords=req.keywords,
    )


@router.get("/skills")
async def list_skills():
    return list_available_skills()


@router.post("/generate-all", response_model=CopyGenerateResponse)
async def generate_all(
    req: CopyGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = _to_context(req.product)

    async def gen_title():
        skill = get_title_skill(req.product.provider)
        return await skill.generate(ctx)

    async def gen_bullets():
        skill = get_bullet_skill(req.product.provider)
        return await skill.generate(ctx)

    async def gen_description():
        skill = get_description_skill(req.product.provider)
        return await skill.generate(ctx)

    async def gen_keywords():
        skill = get_keyword_skill(req.product.provider)
        return await skill.recommend(ctx)

    tasks = {}
    if "title" in req.sections:
        tasks["title"] = gen_title()
    if "bullets" in req.sections:
        tasks["bullets"] = gen_bullets()
    if "description" in req.sections:
        tasks["description"] = gen_description()
    if "keywords" in req.sections:
        tasks["keywords"] = gen_keywords()

    results = {}
    for key, coro in tasks.items():
        results[key] = await coro

    response = CopyGenerateResponse()
    if "title" in results:
        t = results["title"]
        response.title = TitleResponse(title=t.title, char_count=t.char_count, keywords_included=t.keywords_included)
    if "bullets" in results:
        b = results["bullets"]
        response.bullets = BulletResponse(bullets=b.bullets)
    if "description" in results:
        d = results["description"]
        response.description = DescriptionResponse(description=d.description, word_count=d.word_count)
    if "keywords" in results:
        k = results["keywords"]
        response.keywords = KeywordListResponse(
            keywords=[KeywordItem(keyword=kw["keyword"], search_volume=kw["search_volume"], competition=kw["competition"], implanted=kw.get("implanted", False)) for kw in k.keywords]
        )

    return response


@router.post("/generate-title", response_model=TitleResponse)
async def generate_title(
    req: ProductContextRequest,
    current_user: User = Depends(get_current_user),
):
    skill = get_title_skill(req.provider)
    result = await skill.generate(_to_context(req))
    return TitleResponse(title=result.title, char_count=result.char_count, keywords_included=result.keywords_included)


@router.post("/generate-bullets", response_model=BulletResponse)
async def generate_bullets(
    req: ProductContextRequest,
    current_user: User = Depends(get_current_user),
):
    skill = get_bullet_skill(req.provider)
    result = await skill.generate(_to_context(req))
    return BulletResponse(bullets=result.bullets)


@router.post("/generate-description", response_model=DescriptionResponse)
async def generate_description(
    req: ProductContextRequest,
    current_user: User = Depends(get_current_user),
):
    skill = get_description_skill(req.provider)
    result = await skill.generate(_to_context(req))
    return DescriptionResponse(description=result.description, word_count=result.word_count)


@router.post("/keywords", response_model=KeywordListResponse)
async def get_keywords(
    req: ProductContextRequest,
    current_user: User = Depends(get_current_user),
):
    skill = get_keyword_skill(req.provider)
    result = await skill.recommend(_to_context(req))
    return KeywordListResponse(
        keywords=[KeywordItem(keyword=kw["keyword"], search_volume=kw["search_volume"], competition=kw["competition"], implanted=kw.get("implanted", False)) for kw in result.keywords]
    )


@router.post("/optimize")
async def optimize(
    req: OptimizeRequest,
    current_user: User = Depends(get_current_user),
):
    # For now, use DeepSeek to rewrite with target keyword emphasis
    from app.services.deepseek import chat
    system = f"You are an Amazon listing optimizer. Rewrite the following {req.section} to increase keyword density for '{req.target_keyword}' while keeping the original meaning and quality."
    result = chat(req.content, system)
    return {"optimized": result}


@router.post("/confirm")
async def confirm(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=1.0, api_cost=0.004)
        db.commit()
        return {"status": "ok", "credits_deducted": 1}
    except ValueError as e:
        raise HTTPException(402, str(e))
