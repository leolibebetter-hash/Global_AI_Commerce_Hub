import json
from app.services.marketing_skills.base import CampaignContext, CampaignPlanResult, CampaignPlannerSkill
from app.services.deepseek import chat


class DeepSeekCampaignPlanner(CampaignPlannerSkill):
    async def generate(self, ctx: CampaignContext) -> CampaignPlanResult:
        system = (
            "You are a senior marketing strategist specializing in cross-border e-commerce. "
            "Generate creative, data-driven campaign plans. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        prompt = (
            f"Create a marketing campaign plan for:\n"
            f"Product: {ctx.product_name}\n"
            f"Category: {ctx.product_category}\n"
            f"Features: {features_text}\n"
            f"Target Market: {ctx.target_market}\n"
            f"Language: {ctx.language}\n"
            f"Objective: {ctx.objective}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"theme": "campaign theme name",\n'
            f' "description": "1-paragraph campaign overview",\n'
            f' "content_strategy": "2-3 sentence content approach",\n'
            f' "channel_recommendations": [{{"platform": "tiktok", "reason": "...", "content_type": "..."}}],\n'
            f' "hashtags": ["#tag1", "#tag2", ...],\n'
            f' "estimated_budget_tier": "low"|"medium"|"high"}}'
        )

        result = chat(prompt, system, max_tokens=1024)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "theme": f"{ctx.product_name} Campaign",
                "description": result.strip()[:500],
                "content_strategy": "Content strategy pending refinement.",
                "channel_recommendations": [{"platform": "tiktok", "reason": "High engagement", "content_type": "short-video"}],
                "hashtags": [f"#{ctx.product_name.replace(' ', '')}"],
                "estimated_budget_tier": "medium",
            }

        return CampaignPlanResult(
            theme=data.get("theme", ""),
            description=data.get("description", ""),
            content_strategy=data.get("content_strategy", ""),
            channel_recommendations=data.get("channel_recommendations", []),
            hashtags=data.get("hashtags", []),
            estimated_budget_tier=data.get("estimated_budget_tier", "medium"),
        )
