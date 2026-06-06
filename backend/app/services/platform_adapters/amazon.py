"""Mock Amazon SP-API adapter."""
import uuid
from app.services.platform_adapters.base import PlatformAdapter, ListingData, PublishResult


class MockAmazonAdapter(PlatformAdapter):
    platform_name = "amazon"

    async def create_listing(self, data: ListingData) -> PublishResult:
        asin = f"B{uuid.uuid4().hex[:9].upper()}"
        return PublishResult(
            success=True,
            asin=asin,
            listing_id=asin,
            seller_central_url=f"https://sellercentral.amazon.com/products/{asin}",
            platform_listing_url=f"https://amazon.com/dp/{asin}",
        )

    async def get_listing_status(self, listing_id: str) -> dict:
        return {"status": "active", "listing_id": listing_id}
