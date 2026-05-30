from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ProductContext:
    product_name: str
    category: str
    features: list[str] = field(default_factory=list)
    target_market: str = "US"
    language: str = "en"
    keywords: list[str] | None = None


@dataclass
class TitleResult:
    title: str
    char_count: int
    keywords_included: list[str] = field(default_factory=list)


@dataclass
class BulletResult:
    bullets: list[str]  # 5 bullets


@dataclass
class DescriptionResult:
    description: str  # HTML with <br>, <b>
    word_count: int


@dataclass
class KeywordResult:
    keywords: list[dict]  # [{"keyword": str, "search_volume": str, "competition": str, "implanted": bool}]


class TitleSkill(ABC):
    @abstractmethod
    async def generate(self, ctx: ProductContext) -> TitleResult: ...


class BulletSkill(ABC):
    @abstractmethod
    async def generate(self, ctx: ProductContext) -> BulletResult: ...


class DescriptionSkill(ABC):
    @abstractmethod
    async def generate(self, ctx: ProductContext) -> DescriptionResult: ...


class KeywordSkill(ABC):
    @abstractmethod
    async def recommend(self, ctx: ProductContext) -> KeywordResult: ...
