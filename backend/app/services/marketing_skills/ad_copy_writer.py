import json
from app.services.marketing_skills.base import AdCopyContext, AdCopyResult, AdCopyWriterSkill
from app.services.deepseek import chat


class DeepSeekAdCopyWriter(AdCopyWriterSkill):
    async def generate(self, ctx: AdCopyContext) -> AdCopyResult:
        system = (
            "You are a SEM advertising specialist. "
            "Write high-converting ad copy for search and display ads. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        prompt = (
            f"Create {ctx.platform} ad copy for:\n"
            f"Product: {ctx.product_name}\n"
            f"Features: {features_text}\n"
            f"Target Market: {ctx.target_market}\n"
            f"Language: {ctx.language}\n"
            f"Objective: {ctx.objective}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"headlines": ["headline1", "headline2", "headline3", "headline4", "headline5"],\n'
            f' "descriptions": ["description1", "description2", "description3"],\n'
            f' "cta": "call to action text",\n'
            f' "keywords": [{{"keyword": "example", "match_type": "exact"|"phrase"|"broad"}}],\n'
            f' "sitelink_suggestions": ["sitelink1", "sitelink2", "sitelink3"]}}'
        )

        result = chat(prompt, system, max_tokens=800)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "headlines": [f"Buy {ctx.product_name} Online", f"Best {ctx.product_name} Deals", f"Shop {ctx.product_name} Today"],
                "descriptions": [f"Find the best {ctx.product_name} at great prices. Fast shipping."],
                "cta": "Shop Now",
                "keywords": [{"keyword": ctx.product_name, "match_type": "broad"}],
                "sitelink_suggestions": ["Shop All", "Best Sellers", "Contact Us"],
            }

        return AdCopyResult(
            headlines=data.get("headlines", []),
            descriptions=data.get("descriptions", []),
            cta=data.get("cta", ""),
            keywords=data.get("keywords", []),
            sitelink_suggestions=data.get("sitelink_suggestions", []),
        )
