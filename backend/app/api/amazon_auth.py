from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import uuid

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.amazon_account import AmazonAccount

router = APIRouter()


@router.post("/connect")
async def connect_amazon(
    seller_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mock: Connect an Amazon seller account. Real flow uses OAuth 2.0."""
    existing = db.query(AmazonAccount).filter_by(user_id=current_user.id, is_active=True).first()
    if existing:
        raise HTTPException(400, "Amazon account already connected. Disconnect first.")

    account = AmazonAccount(
        user_id=current_user.id,
        seller_id=seller_id,
        access_token="encrypted_mock_access_token_" + str(uuid.uuid4()),
        refresh_token="encrypted_mock_refresh_token_" + str(uuid.uuid4()),
        marketplace_id="ATVPDKIKX0DER",
    )
    db.add(account)
    db.commit()
    return {"status": "connected", "seller_id": seller_id}


@router.get("/status")
async def amazon_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check if user has connected Amazon account."""
    account = db.query(AmazonAccount).filter_by(user_id=current_user.id, is_active=True).first()
    if not account:
        return {"connected": False}
    return {
        "connected": True,
        "seller_id": account.seller_id,
        "marketplace_id": account.marketplace_id,
        "connected_at": account.created_at.isoformat() if account.created_at else None,
    }


@router.post("/disconnect")
async def disconnect_amazon(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(AmazonAccount).filter_by(user_id=current_user.id, is_active=True).first()
    if not account:
        raise HTTPException(404, "No connected Amazon account")
    account.is_active = False
    db.commit()
    return {"status": "disconnected"}
