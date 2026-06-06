"""Multi-platform publish API with account connection management."""
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.platform_account import PlatformAccount
from app.models.publish_record import PublishRecord
from app.services.platform_adapters.registry import get_adapter, list_platforms
from app.services.platform_adapters.base import ListingData
from app.schemas.publish import (
    PlatformAccountConnect, PlatformAccountResponse,
    PlatformAccountListResponse, PublishListingRequest,
    PublishCreateResponse, PublishRecordResponse, PublishHistoryResponse,
)

router = APIRouter()


# ───────────────────────────────────────────────────────
#  Platform Management
# ───────────────────────────────────────────────────────

@router.get("/platforms")
async def get_platforms():
    return {"platforms": list_platforms()}


@router.get("/accounts", response_model=PlatformAccountListResponse)
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    accounts = db.query(PlatformAccount).filter_by(
        user_id=current_user.id,
    ).order_by(PlatformAccount.created_at.desc()).all()
    return PlatformAccountListResponse(
        accounts=[
            PlatformAccountResponse(
                id=a.id, platform=a.platform, seller_id=a.seller_id,
                marketplace_id=a.marketplace_id, store_name=a.store_name,
                is_active=a.is_active, extra_data=a.extra_data,
                created_at=a.created_at,
            ) for a in accounts
        ],
        total=len(accounts),
    )


@router.post("/accounts/connect", response_model=PlatformAccountResponse)
async def connect_account(
    req: PlatformAccountConnect,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Deactivate existing account for same platform
    db.query(PlatformAccount).filter_by(
        user_id=current_user.id, platform=req.platform, is_active=True,
    ).update({"is_active": False})

    account = PlatformAccount(
        user_id=current_user.id,
        platform=req.platform,
        seller_id=req.seller_id,
        access_token=req.access_token,
        refresh_token=req.refresh_token,
        marketplace_id=req.marketplace_id,
        store_name=req.store_name,
        extra_data=req.extra_data,
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    return PlatformAccountResponse(
        id=account.id, platform=account.platform, seller_id=account.seller_id,
        marketplace_id=account.marketplace_id, store_name=account.store_name,
        is_active=account.is_active, extra_data=account.extra_data,
        created_at=account.created_at,
    )


@router.delete("/accounts/{account_id}")
async def disconnect_account(
    account_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(PlatformAccount).filter_by(
        id=account_id, user_id=current_user.id,
    ).first()
    if not account:
        raise HTTPException(404, "Account not found")
    account.is_active = False
    db.commit()
    return {"status": "disconnected"}


# ───────────────────────────────────────────────────────
#  Publishing
# ───────────────────────────────────────────────────────

@router.post("/create", response_model=PublishCreateResponse)
async def create_listing(
    req: PublishListingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify account exists
    account = db.query(PlatformAccount).filter_by(
        user_id=current_user.id,
        platform=req.platform,
        is_active=True,
    ).first()
    if not account:
        raise HTTPException(400, f"No {req.platform} account connected. Connect first.")

    data = ListingData(
        title=req.title,
        bullets=req.bullets,
        description=req.description,
        images=req.images,
        sku=req.sku,
        price=req.price,
        quantity=req.quantity,
        category=req.category,
    )

    adapter = get_adapter(req.platform)
    try:
        result = await adapter.create_listing(data)
    except Exception as e:
        raise HTTPException(503, f"Publish failed: {e}")

    record = PublishRecord(
        user_id=current_user.id,
        platform=req.platform,
        asin=result.asin,
        listing_id=result.listing_id,
        status="published" if result.success else "failed",
        title=req.title,
        sku=req.sku,
        price=req.price,
        error_message=result.error_message,
        seller_central_url=result.seller_central_url or result.platform_listing_url,
    )
    db.add(record)
    db.commit()

    if result.success:
        return PublishCreateResponse(
            status="published", platform=req.platform,
            listing_id=result.listing_id, asin=result.asin,
            seller_central_url=result.seller_central_url or result.platform_listing_url,
            record_id=record.id,
        )
    else:
        return PublishCreateResponse(
            status="failed", platform=req.platform,
            record_id=record.id, error=result.error_message,
        )


@router.get("/history", response_model=PublishHistoryResponse)
async def publish_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status_filter: str | None = Query(None, alias="status"),
    platform: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(PublishRecord).filter_by(user_id=current_user.id)
    if status_filter:
        query = query.filter_by(status=status_filter)
    if platform:
        query = query.filter_by(platform=platform)
    total = query.count()
    records = (
        query.order_by(PublishRecord.created_at.desc(), PublishRecord.id.desc())
        .offset(offset).limit(limit).all()
    )

    return PublishHistoryResponse(
        records=[
            PublishRecordResponse(
                id=r.id, platform=r.platform,
                listing_id=r.listing_id, asin=r.asin,
                status=r.status, title=r.title, sku=r.sku,
                price=r.price, error_message=r.error_message,
                seller_central_url=r.seller_central_url,
                created_at=r.created_at,
            ) for r in records
        ],
        total=total, limit=limit, offset=offset,
    )
