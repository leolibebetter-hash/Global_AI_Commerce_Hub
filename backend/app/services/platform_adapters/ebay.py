"""Mock eBay API adapter."""
import uuid
from app.services.platform_adapters.base import PlatformAdapter, ListingData, PublishResult


class MockEbayAdapter(PlatformAdapter):
    platform_name = "ebay"

    async def create_listing(self, data: ListingData) -> PublishResult:
        item_id = f"{uuid.uuid4().hex[:12]}"
        return PublishResult(
            success=True,
            listing_id=item_id,
            platform_listing_url=f"https://ebay.com/itm/{item_id}",
        )

    async def get_listing_status(self, listing_id: str) -> dict:
        return {"status": "active", "listing_id": listing_id}
