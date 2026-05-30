import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.mysql import DECIMAL
from app.core.database import Base


class RechargeOrder(Base):
    __tablename__ = "recharge_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    order_no: Mapped[str] = mapped_column(String(64), unique=True)
    amount: Mapped[float] = mapped_column(DECIMAL(10, 2))
    payment_method: Mapped[str | None] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    package_type: Mapped[str] = mapped_column(String(20))
    image_credits: Mapped[int] = mapped_column(Integer, default=0)
    text_credits: Mapped[int] = mapped_column(Integer, default=0)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
