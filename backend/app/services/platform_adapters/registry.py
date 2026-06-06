"""Platform adapter registry with lazy imports."""
from app.core.config import settings
from app.services.platform_adapters.base import PlatformAdapter


def get_adapter(platform: str) -> PlatformAdapter:
    provider = getattr(settings, "platform_adapter_provider", "mock") or "mock"

    if platform == "amazon":
        if provider == "mock":
            from app.services.platform_adapters.amazon import MockAmazonAdapter
            return MockAmazonAdapter()
        raise ValueError(f"Amazon real client not configured")
    elif platform == "ebay":
        from app.services.platform_adapters.ebay import MockEbayAdapter
        return MockEbayAdapter()
    elif platform == "shopify":
        from app.services.platform_adapters.shopify import MockShopifyAdapter
        return MockShopifyAdapter()
    elif platform == "tiktok":
        from app.services.platform_adapters.tiktok import MockTiktokAdapter
        return MockTiktokAdapter()
    raise ValueError(f"Unknown platform: {platform}")


def list_platforms() -> list[str]:
    return ["amazon", "ebay", "shopify", "tiktok"]
