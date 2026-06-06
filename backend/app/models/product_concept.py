import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Float, ForeignKey, func, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ProductConcept(Base):
    __tablename__ = "product_concepts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    market: Mapped[str] = mapped_column(String(10), nullable=False)
    concept_description: Mapped[str] = mapped_column(Text, nullable=False)
    specs: Mapped[dict | None] = mapped_column("specs", JSON, nullable=True)
    target_price_range: Mapped[str | None] = mapped_column(String(50), nullable=True)
    design_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    credits_used: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
