"""AI product concept generation service."""
import json
from app.services.deepseek import chat


async def generate_product_concept(
    category: str,
    market: str,
    target_audience: str = "general",
    price_tier: str = "mid",
    language: str = "en",
) -> dict:
    system = (
        "You are a senior product designer and e-commerce strategist. "
        "Generate creative, market-validated product concepts. "
        "Respond ONLY with valid JSON."
    )

    prompt = (
        f"Generate a product concept for:\n"
        f"Category: {category}\n"
        f"Target Market: {market}\n"
        f"Target Audience: {target_audience}\n"
        f"Price Tier: {price_tier}\n"
        f"Language: {language}\n\n"
        f"Return JSON with these keys:\n"
        f'{{"name": "product name",\n'
        f' "concept_description": "2-paragraph product concept",\n'
        f' "specs": {{"material": "...", "dimensions": "...", "weight": "...", '
        f'"key_features": ["...", "..."], "variants": ["color1", "color2"]}},\n'
        f' "target_price_range": "$X-$Y",\n'
        f' "design_notes": "manufacturing and design considerations",\n'
        f' "market_fit": "why this product fits the target market",\n'
        f' "competitive_advantage": "key differentiator"}}\n\n'
        f"Be creative but practical. Suggest realistic specs and achievable price points."
    )

    result = chat(prompt, system, max_tokens=800)
    try:
        data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
    except json.JSONDecodeError:
        data = {
            "name": f"{category} Product",
            "concept_description": result.strip()[:500],
            "specs": {"key_features": []},
            "target_price_range": "$10-30",
            "design_notes": "",
            "market_fit": "",
            "competitive_advantage": "",
        }

    return data
