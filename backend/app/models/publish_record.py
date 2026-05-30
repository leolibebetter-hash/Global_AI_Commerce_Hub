import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, func, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class PublishRecord(Base):
    __tablename__ = "publish_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    asin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    seller_central_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
