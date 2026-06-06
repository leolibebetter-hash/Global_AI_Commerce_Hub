"""Mock TikTok Shop API adapter."""
import uuid
from app.services.platform_adapters.base import PlatformAdapter, ListingData, PublishResult


class MockTiktokAdapter(PlatformAdapter):
    platform_name = "tiktok"

    async def create_listing(self, data: ListingData) -> PublishResult:
        product_id = f"{uuid.uuid4().hex[:8]}"
        return PublishResult(
            success=True,
            listing_id=product_id,
            platform_listing_url=f"https://seller.tiktok.com/product/{product_id}",
        )

    async def get_listing_status(self, listing_id: str) -> dict:
        return {"status": "active", "listing_id": listing_id}
