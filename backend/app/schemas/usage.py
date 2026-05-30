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
    total_images: int
    total_text_generations: int
    total_api_cost: float
    period: str  # "current_month"
