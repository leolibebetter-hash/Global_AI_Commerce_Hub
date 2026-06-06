"""Dashboard summary API aggregating stats from all modules."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.user_ai_balance import UserAIBalance
from app.models.user_ai_usage import UserAIUsage
from app.models.publish_record import PublishRecord
from app.models.marketing_campaign import MarketingCampaign
from app.models.marketing_content import MarketingContent
from app.models.market_research import MarketResearchResult

router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id

    # Credits
    balance = db.query(UserAIBalance).filter_by(user_id=user_id).first()
    image_credits = balance.image_credits if balance else 0
    text_credits = balance.text_credits if balance else 0

    # Module counts
    total_campaigns = db.query(MarketingCampaign).filter_by(user_id=user_id).count()
    total_marketing_content = db.query(MarketingContent).filter_by(user_id=user_id).count()
    total_market_research = db.query(MarketResearchResult).filter_by(user_id=user_id).count()
    total_published = db.query(PublishRecord).filter_by(user_id=user_id).count()

    # Publish by platform
    publish_by_platform = {}
    records = db.query(PublishRecord).filter_by(user_id=user_id).all()
    for r in records:
        plat = r.platform or "amazon"
        publish_by_platform[plat] = publish_by_platform.get(plat, 0) + 1

    # Marketing content by type
    content_by_type = {}
    contents = db.query(MarketingContent).filter_by(user_id=user_id).all()
    for c in contents:
        ct = c.content_type
        content_by_type[ct] = content_by_type.get(ct, 0) + 1

    # Recent activity (last 10 items across all modules)
    recent = []

    # Recent marketing campaigns
    campaigns = db.query(MarketingCampaign).filter_by(user_id=user_id)\
        .order_by(MarketingCampaign.created_at.desc()).limit(5).all()
    for c in campaigns:
        recent.append({
            "type": "campaign", "title": c.name, "status": c.status,
            "module": "marketing", "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    # Recent publish records
    pub_records = db.query(PublishRecord).filter_by(user_id=user_id)\
        .order_by(PublishRecord.created_at.desc()).limit(5).all()
    for r in pub_records:
        recent.append({
            "type": "publish", "title": r.title, "status": r.status,
            "module": "publish", "platform": r.platform,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    # Recent market research
    research = db.query(MarketResearchResult).filter_by(user_id=user_id)\
        .order_by(MarketResearchResult.created_at.desc()).limit(5).all()
    for mr in research:
        recent.append({
            "type": "research", "title": mr.title, "analysis_type": mr.analysis_type,
            "module": "market_research", "created_at": mr.created_at.isoformat() if mr.created_at else None,
        })

    # Sort and limit
    recent.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    recent = recent[:10]

    return {
        "credits": {
            "image_credits": image_credits,
            "text_credits": text_credits,
        },
        "stats": {
            "total_campaigns": total_campaigns,
            "total_marketing_content": total_marketing_content,
            "total_market_research": total_market_research,
            "total_published": total_published,
            "publish_by_platform": publish_by_platform,
            "content_by_type": content_by_type,
        },
        "recent_activity": recent,
    }
