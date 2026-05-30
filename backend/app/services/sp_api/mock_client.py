import uuid
from app.services.sp_api.base import SPAPIClient, ListingData, PublishResult


class MockSPAPIClient(SPAPIClient):
    async def create_listing(self, data: ListingData, access_token: str) -> PublishResult:
        asin = f"B{uuid.uuid4().hex[:9].upper()}"
        return PublishResult(
            success=True,
            asin=asin,
            listing_id=f"LIST_{uuid.uuid4().hex[:8].upper()}",
            seller_central_url=f"https://sellercentral.amazon.com/listing/{asin}",
        )

    async def get_listing_status(self, asin: str, access_token: str) -> dict:
        return {"asin": asin, "status": "DRAFT"}
