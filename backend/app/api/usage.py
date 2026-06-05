from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.user_ai_usage import UserAIUsage
from app.models.publish_record import PublishRecord
from app.services.usage import get_balance, get_usage_history
from app.schemas.usage import (
    BalanceResponse,
    UsageRecord,
    UsageHistoryResponse,
    UsageSummaryResponse,
)

router = APIRouter()


@router.get("/balance", response_model=BalanceResponse)
def balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    b = get_balance(db, current_user.id)
    return BalanceResponse(image_credits=b.image_credits, text_credits=b.text_credits)


@router.get("/history", response_model=UsageHistoryResponse)
def history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = get_usage_history(db, current_user.id, limit=limit, offset=offset)
    total = db.query(UserAIUsage).filter_by(user_id=current_user.id).count()
    return UsageHistoryResponse(
        records=[
            UsageRecord(
                id=r.id,
                action_type=r.action_type,
                credits_used=r.credits_used,
                api_cost=r.api_cost,
                metadata=r.metadata_,
                created_at=r.created_at.isoformat() if r.created_at else "",
            )
            for r in records
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/summary", response_model=UsageSummaryResponse)
def summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    month_start = datetime.now(timezone.utc).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    rows = (
        db.query(
            UserAIUsage.action_type,
            func.count(UserAIUsage.id).label("count"),
            func.coalesce(func.sum(UserAIUsage.api_cost), 0).label("total_cost"),
        )
        .filter(
            UserAIUsage.user_id == current_user.id,
            UserAIUsage.created_at >= month_start,
        )
        .group_by(UserAIUsage.action_type)
        .all()
    )
    total_images = sum(r.count for r in rows if r.action_type == "image_gen")
    total_text = sum(r.count for r in rows if r.action_type == "text_gen")
    total_cost = sum(float(r.total_cost) for r in rows)
    total_published = (
        db.query(func.count(PublishRecord.id))
        .filter(
            PublishRecord.user_id == current_user.id,
            PublishRecord.created_at >= month_start,
        )
        .scalar()
    )
    return UsageSummaryResponse(
        total_images=total_images,
        total_text=total_text,
        total_published=total_published or 0,
        total_api_cost=round(total_cost, 6),
        period="current_month",
    )
