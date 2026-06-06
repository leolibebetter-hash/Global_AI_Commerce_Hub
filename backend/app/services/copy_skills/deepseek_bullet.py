from app.services.copy_skills.base import ProductContext, BulletResult, BulletSkill
from app.services.deepseek import chat


class DeepSeekBulletSkill(BulletSkill):
    async def generate(self, ctx: ProductContext) -> BulletResult:
        market_hints = {
            "US": "American buyers scan for key benefits quickly. Lead with the strongest selling point.",
            "UK": "British buyers value clarity and honesty. Avoid exaggerated claims.",
            "DE": "German buyers expect technical details. Mention materials, dimensions, certifications.",
            "JP": "Japanese buyers value thoroughness. Include usage scenarios and quality assurances.",
            "FR": "French buyers appreciate style and quality. Emphasize craftsmanship and design.",
            "CA": "Canadian buyers value practicality. Note bilingual packaging if relevant.",
            "AU": "Australian buyers value durability. Mention suitability for local conditions.",
        }
        hint = market_hints.get(ctx.target_market, market_hints["US"])

        system = (
            "You are an Amazon bullet points specialist. "
            f"{hint} "
            "Write exactly 5 bullet points for a product listing in the target language. "
            "One bullet per line, no numbering. "
            "Each bullet should highlight a key feature or benefit."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        keywords_text = ", ".join(ctx.keywords) if ctx.keywords else "N/A"

        prompt = (
            f"Product: {ctx.product_name}\n"
            f"Category: {ctx.category}\n"
            f"Features: {features_text}\n"
            f"Target Market: {ctx.target_market}\n"
            f"Language: {ctx.language}\n"
            f"Target Keywords: {keywords_text}\n\n"
            f"Write 5 bullet points in {ctx.language}, one per line."
        )

        result = chat(prompt, system)
        lines = [line.strip() for line in result.strip().split("\n") if line.strip()]
        bullets = lines[:5]

        return BulletResult(bullets=bullets)
