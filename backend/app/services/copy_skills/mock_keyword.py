from app.services.copy_skills.base import ProductContext, KeywordResult, KeywordSkill


class MockKeywordSkill(KeywordSkill):
    """Returns a static list of 25 keywords for testing (no API call)."""

    async def recommend(self, ctx: ProductContext) -> KeywordResult:
        keywords = [
            {"keyword": f"{ctx.product_name} premium", "search_volume": "high", "competition": "medium", "implanted": False},
            {"keyword": f"best {ctx.product_name}", "search_volume": "high", "competition": "high", "implanted": False},
            {"keyword": f"buy {ctx.product_name}", "search_volume": "high", "competition": "high", "implanted": False},
            {"keyword": f"{ctx.product_name} for sale", "search_volume": "medium", "competition": "medium", "implanted": False},
            {"keyword": f"cheap {ctx.product_name}", "search_volume": "medium", "competition": "medium", "implanted": False},
            {"keyword": f"{ctx.product_name} online", "search_volume": "medium", "competition": "low", "implanted": False},
            {"keyword": f"{ctx.product_name} 2025", "search_volume": "medium", "competition": "low", "implanted": False},
            {"keyword": f"affordable {ctx.product_name}", "search_volume": "medium", "competition": "medium", "implanted": False},
            {"keyword": f"top rated {ctx.product_name}", "search_volume": "low", "competition": "medium", "implanted": False},
            {"keyword": f"new {ctx.product_name}", "search_volume": "low", "competition": "low", "implanted": False},
            {"keyword": f"{ctx.product_name} review", "search_volume": "low", "competition": "low", "implanted": False},
            {"keyword": f"{ctx.category} tools", "search_volume": "high", "competition": "high", "implanted": False},
            {"keyword": f"best {ctx.category}", "search_volume": "high", "competition": "high", "implanted": False},
            {"keyword": f"{ctx.category} for home", "search_volume": "medium", "competition": "medium", "implanted": False},
            {"keyword": f"professional {ctx.category}", "search_volume": "medium", "competition": "medium", "implanted": False},
            {"keyword": f"{ctx.category} for beginners", "search_volume": "medium", "competition": "low", "implanted": False},
            {"keyword": f"{ctx.category} kit", "search_volume": "medium", "competition": "medium", "implanted": False},
            {"keyword": f"{ctx.product_name} {ctx.category}", "search_volume": "low", "competition": "low", "implanted": False},
            {"keyword": f"where to buy {ctx.product_name}", "search_volume": "low", "competition": "low", "implanted": False},
            {"keyword": f"{ctx.product_name} near me", "search_volume": "low", "competition": "low", "implanted": False},
            {"keyword": f"discount {ctx.product_name}", "search_volume": "medium", "competition": "medium", "implanted": False},
            {"keyword": f"{ctx.product_name} deals", "search_volume": "low", "competition": "medium", "implanted": False},
            {"keyword": f"lightweight {ctx.product_name}", "search_volume": "low", "competition": "low", "implanted": False},
            {"keyword": f"portable {ctx.product_name}", "search_volume": "low", "competition": "low", "implanted": False},
            {"keyword": f"{ctx.product_name} accessories", "search_volume": "medium", "competition": "low", "implanted": False},
        ]

        # Mark implanted if the keyword text appears in ctx.keywords
        if ctx.keywords:
            ctx_keywords_lower = [k.lower() for k in ctx.keywords]
            for kw in keywords:
                if any(ck in kw["keyword"].lower() for ck in ctx_keywords_lower):
                    kw["implanted"] = True

        return KeywordResult(keywords=keywords)
