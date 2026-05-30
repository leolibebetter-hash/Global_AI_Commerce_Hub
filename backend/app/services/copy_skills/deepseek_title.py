from app.services.copy_skills.base import ProductContext, TitleResult, TitleSkill
from app.services.deepseek import chat


class DeepSeekTitleSkill(TitleSkill):
    async def generate(self, ctx: ProductContext) -> TitleResult:
        system = (
            "You are an Amazon listing specialist and expert title writer. "
            "Generate a single product title under 200 characters. "
            "Use only plain text — no quotes around the title."
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
            f"Write a compelling Amazon product title (under 200 characters) that incorporates relevant keywords naturally."
        )

        result = chat(prompt, system)
        title = result.strip().strip('"').strip("'")

        char_count = len(title)
        keywords_included = []
        if ctx.keywords:
            lower_title = title.lower()
            for kw in ctx.keywords:
                if kw.lower() in lower_title:
                    keywords_included.append(kw)

        return TitleResult(
            title=title,
            char_count=char_count,
            keywords_included=keywords_included,
        )
