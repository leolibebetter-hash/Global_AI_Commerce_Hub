from app.core.config import settings
from app.services.sp_api.base import SPAPIClient


def get_sp_api_client() -> SPAPIClient:
    if settings.sp_api_client == "mock":
        from app.services.sp_api.mock_client import MockSPAPIClient
        return MockSPAPIClient()
    if settings.sp_api_client == "amazon":
        from app.services.sp_api.amazon_client import AmazonSPAPIClient
        return AmazonSPAPIClient()
    raise ValueError(f"Unknown SP-API client: {settings.sp_api_client}")
