from app.services.copy_skills.base import ProductContext, DescriptionResult, DescriptionSkill
from app.services.deepseek import chat


class DeepSeekDescriptionSkill(DescriptionSkill):
    async def generate(self, ctx: ProductContext) -> DescriptionResult:
        system = (
            "You are an Amazon product description writer. "
            "Write a compelling product description in HTML format. "
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
            f"Write an HTML product description using <br> and <b> tags. "
            f"Include the target keywords naturally."
        )

        result = chat(prompt, system)
        description = result.strip()

        word_count = len(description.split())

        return DescriptionResult(
            description=description,
            word_count=word_count,
        )
