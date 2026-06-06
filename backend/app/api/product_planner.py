"""Product planner API — AI product concept generation."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.product_concept import ProductConcept
from app.services.product_planner import generate_product_concept
from app.services.usage import deduct_credits
from pydantic import BaseModel, Field

router = APIRouter()


class GenerateRequest(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    market: str = Field(default="US", pattern=r"^(US|UK|DE|JP|FR|CA|AU)$")
    target_audience: str = Field(default="general", max_length=100)
    price_tier: str = Field(default="mid", pattern=r"^(low|mid|premium)$")
    language: str = Field(default="en", pattern=r"^(en|zh|de|ja|fr)$")


@router.post("/generate")
async def generate(
    req: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        data = await generate_product_concept(
            category=req.category,
            market=req.market,
            target_audience=req.target_audience,
            price_tier=req.price_tier,
            language=req.language,
        )
    except Exception as e:
        raise HTTPException(503, f"AI generation failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=1.5, api_cost=0.006)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    concept = ProductConcept(
        user_id=current_user.id,
        name=data.get("name", ""),
        category=req.category,
        market=req.market,
        concept_description=data.get("concept_description", ""),
        specs=data.get("specs"),
        target_price_range=data.get("target_price_range"),
        design_notes=data.get("design_notes"),
        credits_used=1.5,
    )
    db.add(concept)
    db.commit()
    db.refresh(concept)

    return {
        "id": concept.id,
        "name": concept.name,
        "category": concept.category,
        "market": concept.market,
        "concept_description": concept.concept_description,
        "specs": concept.specs,
        "target_price_range": concept.target_price_range,
        "design_notes": concept.design_notes,
        "market_fit": data.get("market_fit", ""),
        "competitive_advantage": data.get("competitive_advantage", ""),
        "credits_used": 1.5,
    }


@router.get("/concepts")
async def list_concepts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    concepts = db.query(ProductConcept).filter_by(user_id=current_user.id)\
        .order_by(ProductConcept.created_at.desc()).limit(20).all()
    return {
        "concepts": [
            {
                "id": c.id, "name": c.name, "category": c.category,
                "market": c.market, "concept_description": c.concept_description,
                "specs": c.specs, "target_price_range": c.target_price_range,
                "design_notes": c.design_notes, "credits_used": c.credits_used,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in concepts
        ],
        "total": len(concepts),
    }
