from datetime import datetime
from sqlalchemy.orm import Session
from app.models.user_ai_balance import UserAIBalance
from app.models.user_ai_usage import UserAIUsage


def get_balance(db: Session, user_id: str) -> UserAIBalance:
    balance = db.query(UserAIBalance).filter_by(user_id=user_id).first()
    if balance is None:
        balance = UserAIBalance(user_id=user_id, image_credits=0, text_credits=0)
        db.add(balance)
        db.flush()
    return balance


def deduct_credits(
    db: Session,
    user_id: str,
    action_type: str,
    credits_used: float,
    api_cost: float = 0,
    metadata: dict | None = None,
) -> UserAIUsage:
    """Deduct credits from user balance and create usage record. All in one transaction."""
    balance = get_balance(db, user_id)

    if action_type in ("image_gen", "text_gen"):
        field = "image_credits" if action_type == "image_gen" else "text_credits"
        current = getattr(balance, field)
        if current < credits_used:
            raise ValueError(f"Insufficient {field}: have {current}, need {credits_used}")
        setattr(balance, field, current - credits_used)

    usage = UserAIUsage(
        user_id=user_id,
        action_type=action_type,
        credits_used=credits_used,
        api_cost=api_cost,
        metadata_=metadata,
    )
    db.add(usage)
    return usage


def get_usage_history(
    db: Session, user_id: str, limit: int = 20, offset: int = 0
) -> list[UserAIUsage]:
    return (
        db.query(UserAIUsage)
        .filter_by(user_id=user_id)
        .order_by(UserAIUsage.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
