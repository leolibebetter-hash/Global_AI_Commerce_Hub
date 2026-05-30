from app.services.copy_skills.base import ProductContext, BulletResult, BulletSkill
from app.services.deepseek import chat


class DeepSeekBulletSkill(BulletSkill):
    async def generate(self, ctx: ProductContext) -> BulletResult:
        system = (
            "You are an Amazon bullet points specialist. "
            "Write exactly 5 bullet points for a product listing. "
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
            f"Write 5 bullet points, one per line."
        )

        result = chat(prompt, system)
        lines = [line.strip() for line in result.strip().split("\n") if line.strip()]
        bullets = lines[:5]

        return BulletResult(bullets=bullets)
