import json
from app.services.marketing_skills.base import AudienceContext, AudienceProfileResult, AudienceAnalyzerSkill
from app.services.deepseek import chat


class DeepSeekAudienceAnalyzer(AudienceAnalyzerSkill):
    async def analyze(self, ctx: AudienceContext) -> AudienceProfileResult:
        system = (
            "You are a consumer insights and market research analyst. "
            "Analyze target audiences for e-commerce products. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        interests_text = ", ".join(ctx.interests) if ctx.interests else "N/A"
        prompt = (
            f"Analyze the target audience for:\n"
            f"Product Category: {ctx.product_category}\n"
            f"Target Market: {ctx.target_market}\n"
            f"Related Interests: {interests_text}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"demographics": {{"age_range": "e.g. 18-34", "gender_split": "...", "income_level": "...", "location": "..."}},\n'
            f' "interests_behaviors": ["interest1", "interest2", ...],\n'
            f' "content_preferences": ["preferred content type 1", ...],\n'
            f' "platform_usage": {{"primary": ["platform1"], "secondary": ["platform2"]}},\n'
            f' "pain_points": ["pain point 1", ...],\n'
            f' "purchase_motivations": ["motivation 1", ...]}}'
        )

        result = chat(prompt, system, max_tokens=800)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "demographics": {"age_range": "18-44", "gender_split": "Mixed", "income_level": "Middle", "location": ctx.target_market},
                "interests_behaviors": ctx.interests or ["online shopping", "tech"],
                "content_preferences": ["video reviews", "social media posts"],
                "platform_usage": {"primary": ["Instagram", "TikTok"], "secondary": ["Facebook", "YouTube"]},
                "pain_points": ["Price sensitivity", "Quality concerns"],
                "purchase_motivations": ["Good reviews", "Fast shipping"],
            }

        return AudienceProfileResult(
            demographics=data.get("demographics", {}),
            interests_behaviors=data.get("interests_behaviors", []),
            content_preferences=data.get("content_preferences", []),
            platform_usage=data.get("platform_usage", {}),
            pain_points=data.get("pain_points", []),
            purchase_motivations=data.get("purchase_motivations", []),
        )
