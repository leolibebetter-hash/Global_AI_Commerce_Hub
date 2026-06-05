from pydantic import BaseModel
from datetime import datetime


class BalanceResponse(BaseModel):
    image_credits: int
    text_credits: int


class UsageRecord(BaseModel):
    id: str
    action_type: str
    credits_used: float
    api_cost: float | None
    metadata: dict | None
    created_at: str


class UsageHistoryResponse(BaseModel):
    records: list[UsageRecord]
    total: int
    limit: int
    offset: int


class UsageSummaryResponse(BaseModel):
    total_images: int = 0
    total_text: int = 0
    total_published: int = 0
    total_api_cost: float = 0.0
    period: str = "current_month"
