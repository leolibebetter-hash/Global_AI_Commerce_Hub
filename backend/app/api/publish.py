import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.amazon_account import AmazonAccount
from app.models.publish_record import PublishRecord
from app.services.sp_api.registry import get_sp_api_client
from app.services.sp_api.base import ListingData

router = APIRouter()


@router.post("/create")
async def create_listing(
    title: str,
    bullets: str,
    description: str,
    images: str,
    sku: str,
    price: float,
    quantity: int,
    category: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(AmazonAccount).filter_by(user_id=current_user.id, is_active=True).first()
    if not account:
        raise HTTPException(400, "No Amazon account connected. Connect first.")

    data = ListingData(
        title=title,
        bullets=json.loads(bullets),
        description=description,
        images=json.loads(images),
        sku=sku,
        price=price,
        quantity=quantity,
        category=category,
    )

    client = get_sp_api_client()
    result = await client.create_listing(data, account.access_token)

    record = PublishRecord(
        user_id=current_user.id,
        asin=result.asin,
        status="published" if result.success else "failed",
        title=title,
        sku=sku,
        price=price,
        error_message=result.error_message,
        seller_central_url=result.seller_central_url,
    )
    db.add(record)
    db.commit()

    if result.success:
        return {
            "status": "published",
            "asin": result.asin,
            "seller_central_url": result.seller_central_url,
            "record_id": record.id,
        }
    else:
        return {
            "status": "failed",
            "error": result.error_message,
            "record_id": record.id,
        }


@router.get("/history")
async def publish_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(PublishRecord).filter_by(user_id=current_user.id)
    if status_filter:
        query = query.filter_by(status=status_filter)
    total = query.count()
    records = query.order_by(PublishRecord.created_at.desc(), PublishRecord.id.desc()).offset(offset).limit(limit).all()

    return {
        "records": [
            {
                "id": r.id,
                "asin": r.asin,
                "status": r.status,
                "title": r.title,
                "sku": r.sku,
                "price": r.price,
                "error_message": r.error_message,
                "seller_central_url": r.seller_central_url,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }
