from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ListingData:
    title: str
    bullets: list[str]
    description: str
    images: list[str]  # URLs
    sku: str
    price: float
    quantity: int
    category: str


@dataclass
class PublishResult:
    success: bool
    asin: str | None = None
    listing_id: str | None = None
    seller_central_url: str | None = None
    error_message: str | None = None


class SPAPIClient(ABC):
    @abstractmethod
    async def create_listing(self, data: ListingData, access_token: str) -> PublishResult:
        """Create a draft listing via SP-API Listings Items API."""

    @abstractmethod
    async def get_listing_status(self, asin: str, access_token: str) -> dict:
        """Check listing status."""
