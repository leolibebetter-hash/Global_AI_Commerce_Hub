from app.services.sp_api.base import SPAPIClient, ListingData, PublishResult


class AmazonSPAPIClient(SPAPIClient):
    async def create_listing(self, data: ListingData, access_token: str) -> PublishResult:
        raise NotImplementedError("Amazon SP-API not yet configured")

    async def get_listing_status(self, asin: str, access_token: str) -> dict:
        raise NotImplementedError("Amazon SP-API not yet configured")
