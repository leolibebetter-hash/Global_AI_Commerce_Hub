import json
from app.services.market_research_skills.base import TrendingContext, TrendingResult, TrendingAnalyzerSkill
from app.services.deepseek import chat


class DeepSeekTrendingAnalyzer(TrendingAnalyzerSkill):
    async def analyze(self, ctx: TrendingContext) -> TrendingResult:
        system = (
            "You are a senior e-commerce market analyst. "
            "Analyze trending products in a given category and market. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        prompt = (
            f"Analyze trending products for:\n"
            f"Category: {ctx.category}\n"
            f"Market: {ctx.market}\n"
            f"Platform: {ctx.platform}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"title": "report title",\n'
            f' "summary": "one-line summary of key findings",\n'
            f' "body": "full markdown report with sections: Market Overview, Key Trends, Hot Subcategories, Recommendations",\n'
            f' "products": [{{"name": "...", "category": "...", "growth_pct": 150, "price_range": "$20-40", "platform": "{ctx.platform}", "rank": 1, "insight": "..."}}]}}\n\n'
            f"Provide 5-8 trending products with realistic growth percentages (50-400%) and meaningful insights."
        )

        result = chat(prompt, system, max_tokens=1200)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "title": f"Trending Products in {ctx.category} ({ctx.market})",
                "summary": f"Analysis of trending products in the {ctx.category} category for {ctx.market} market.",
                "body": result.strip()[:800],
                "products": [],
            }

        return TrendingResult(
            title=data.get("title", ""),
            summary=data.get("summary", ""),
            body=data.get("body", ""),
            structured_data={"products": data.get("products", [])},
        )
