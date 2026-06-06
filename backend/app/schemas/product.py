"""Pydantic schemas for product copy factory endpoints."""

from pydantic import BaseModel, Field


class ProductContextRequest(BaseModel):
    product_name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    features: list[str] = Field(default_factory=list, max_length=10)
    target_market: str = Field(default="US", pattern=r"^(US|UK|DE|JP|FR|CA|AU)$")
    language: str = Field(default="en", pattern=r"^(en|zh|de|ja|fr)$")
    keywords: list[str] | None = None
    provider: str = Field(default="deepseek")


class TitleResponse(BaseModel):
    title: str
    char_count: int
    keywords_included: list[str]


class BulletResponse(BaseModel):
    bullets: list[str]


class DescriptionResponse(BaseModel):
    description: str
    word_count: int


class KeywordItem(BaseModel):
    keyword: str
    search_volume: str  # "high" | "medium" | "low"
    competition: str    # "high" | "medium" | "low"
    implanted: bool


class KeywordListResponse(BaseModel):
    keywords: list[KeywordItem]


class CopyGenerateRequest(BaseModel):
    product: ProductContextRequest
    sections: list[str] = Field(default=["title", "bullets", "description", "keywords"])


class CopyGenerateResponse(BaseModel):
    title: TitleResponse | None = None
    bullets: BulletResponse | None = None
    description: DescriptionResponse | None = None
    keywords: KeywordListResponse | None = None


class OptimizeRequest(BaseModel):
    content: str
    target_keyword: str
    section: str  # "title" | "bullets" | "description"
