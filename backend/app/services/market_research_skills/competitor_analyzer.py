import json
from app.services.market_research_skills.base import CompetitorContext, CompetitorResult, CompetitorAnalyzerSkill
from app.services.deepseek import chat


class DeepSeekCompetitorAnalyzer(CompetitorAnalyzerSkill):
    async def analyze(self, ctx: CompetitorContext) -> CompetitorResult:
        system = (
            "You are a competitive intelligence analyst for e-commerce. "
            "Analyze competitors and identify differentiation opportunities. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        prompt = (
            f"Analyze competitors for:\n"
            f"Product: {ctx.product_name}\n"
            f"Features: {features_text}\n"
            f"Market: {ctx.market}\n"
            f"Platform: {ctx.platform}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"title": "report title",\n'
            f' "summary": "one-line competitive landscape summary",\n'
            f' "body": "full markdown report with sections: Competitive Landscape, Top Competitors, Pricing Analysis, Market Positioning, Recommendations",\n'
            f' "competitors": [{{"name": "...", "price": "$X", "rating": 4.3, "strengths": ["..."], "weaknesses": ["..."], "strategy": "..."}}],\n'
            f' "differentiation_opportunities": ["opportunity 1", "opportunity 2", ...],\n'
            f' "pricing_advice": "suggested pricing strategy"}}\n\n'
            f"Provide 4-6 competitors with realistic data and actionable differentiation opportunities."
        )

        result = chat(prompt, system, max_tokens=1200)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "title": f"Competitor Analysis: {ctx.product_name} ({ctx.market})",
                "summary": f"Competitive analysis for {ctx.product_name} in {ctx.market}.",
                "body": result.strip()[:800],
                "competitors": [],
                "differentiation_opportunities": [],
                "pricing_advice": "",
            }

        return CompetitorResult(
            title=data.get("title", ""),
            summary=data.get("summary", ""),
            body=data.get("body", ""),
            structured_data={
                "competitors": data.get("competitors", []),
                "differentiation_opportunities": data.get("differentiation_opportunities", []),
                "pricing_advice": data.get("pricing_advice", ""),
            },
        )
