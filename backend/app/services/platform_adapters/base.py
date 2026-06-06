"""Platform adapter base classes and data types."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ListingData:
    title: str
    bullets: list[str]
    description: str
    images: list[str]
    sku: str
    price: float
    quantity: int
    category: str
    extra: dict = field(default_factory=dict)


@dataclass
class PublishResult:
    success: bool
    listing_id: str | None = None
    asin: str | None = None
    seller_central_url: str | None = None
    platform_listing_url: str | None = None
    error_message: str | None = None


class PlatformAdapter(ABC):
    """Unified interface for all e-commerce platform publishing APIs."""

    @property
    @abstractmethod
    def platform_name(self) -> str: ...

    @abstractmethod
    async def create_listing(self, data: ListingData) -> PublishResult:
        """Create a listing on the target platform."""

    @abstractmethod
    async def get_listing_status(self, listing_id: str) -> dict:
        """Check listing status on the platform."""
