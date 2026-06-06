from app.services.copy_skills.base import ProductContext, DescriptionResult, DescriptionSkill
from app.services.deepseek import chat


class DeepSeekDescriptionSkill(DescriptionSkill):
    async def generate(self, ctx: ProductContext) -> DescriptionResult:
        market_hints = {
            "US": "US Amazon shoppers expect scannable HTML with bold highlights, benefit-driven copy, and social proof elements.",
            "UK": "UK Amazon shoppers prefer detailed specs with proper British spelling and trustworthy, understated tone.",
            "DE": "German shoppers expect thorough technical details, energy efficiency info, material composition, and safety certifications.",
            "JP": "Japanese shoppers expect polite language, detailed usage instructions, size/fit guides, and quality guarantees.",
            "FR": "French shoppers appreciate elegant descriptions, brand storytelling, and emphasis on quality and origin.",
            "CA": "Canadian shoppers are similar to US but note any bilingual packaging and local warranty/service info.",
            "AU": "Australian shoppers value practical descriptions with durability emphasis and outdoor/weather suitability.",
        }
        hint = market_hints.get(ctx.target_market, market_hints["US"])

        system = (
            "You are an Amazon product description writer. "
            f"{hint} "
            "Write a compelling product description in HTML format in the target language. "
            "Use <br> for line breaks and <b> for emphasis. "
            "Write 250-2000 words."
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
            f"Write an HTML product description in {ctx.language} using <br> and <b> tags. "
            f"Include the target keywords naturally."
        )

        result = chat(prompt, system)
        description = result.strip()

        word_count = len(description.split())

        return DescriptionResult(
            description=description,
            word_count=word_count,
        )
