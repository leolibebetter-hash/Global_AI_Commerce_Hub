import json
from app.services.market_research_skills.base import KeywordContext, KeywordResult, KeywordResearcherSkill
from app.services.deepseek import chat


class DeepSeekKeywordResearcher(KeywordResearcherSkill):
    async def research(self, ctx: KeywordContext) -> KeywordResult:
        system = (
            "You are an SEO and e-commerce keyword research specialist. "
            "Research high-potential keywords for product categories. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        seed_text = ", ".join(ctx.seed_keywords) if ctx.seed_keywords else "N/A"
        prompt = (
            f"Research keywords for:\n"
            f"Product Category: {ctx.product_category}\n"
            f"Seed Keywords: {seed_text}\n"
            f"Market: {ctx.market}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"title": "report title",\n'
            f' "summary": "one-line summary",\n'
            f' "body": "full markdown report with sections: Keyword Overview, High-Volume Keywords, Low-Competition Opportunities, Long-Tail Suggestions, Seasonal Trends",\n'
            f' "keywords": [{{"keyword": "eco friendly water bottle", "search_volume": "high", "competition": "medium", "relevance": 0.95, "suggested_bid": "$0.50"}}]}}\n\n'
            f"Provide 8-12 keywords with realistic search volume (high/medium/low), competition (high/medium/low), relevance (0.0-1.0), and suggested PPC bids."
        )

        result = chat(prompt, system, max_tokens=1000)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "title": f"Keyword Research: {ctx.product_category} ({ctx.market})",
                "summary": f"Keyword analysis for {ctx.product_category} in {ctx.market}.",
                "body": result.strip()[:800],
                "keywords": [],
            }

        return KeywordResult(
            title=data.get("title", ""),
            summary=data.get("summary", ""),
            body=data.get("body", ""),
            structured_data={"keywords": data.get("keywords", [])},
        )
