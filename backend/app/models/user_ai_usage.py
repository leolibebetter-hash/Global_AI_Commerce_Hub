import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.mysql import DECIMAL
from app.core.database import Base


class UserAIUsage(Base):
    __tablename__ = "user_ai_usage"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    action_type: Mapped[str] = mapped_column(String(20), index=True)
    credits_used: Mapped[float] = mapped_column(DECIMAL(10, 4))
    api_cost: Mapped[float | None] = mapped_column(DECIMAL(10, 6), default=0)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
