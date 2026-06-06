import json
from app.services.marketing_skills.base import PostContext, SocialPostResult, PostWriterSkill
from app.services.deepseek import chat


class DeepSeekPostWriter(PostWriterSkill):
    async def generate(self, ctx: PostContext) -> SocialPostResult:
        system = (
            "You are a social media content strategist. "
            "Write engaging, platform-optimized posts that drive engagement. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        prompt = (
            f"Write a {ctx.platform} post for:\n"
            f"Product: {ctx.product_name}\n"
            f"Features: {features_text}\n"
            f"Tone: {ctx.tone}\n"
            f"Key Message: {ctx.key_message or 'Promote the product'}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"caption": "full post caption with emojis",\n'
            f' "hashtags": ["#tag1", "#tag2", ...],\n'
            f' "image_description": "visual concept for accompanying image",\n'
            f' "best_posting_time": "suggested time in local timezone",\n'
            f' "engagement_tips": "tips to boost engagement"}}'
        )

        result = chat(prompt, system, max_tokens=800)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "caption": result.strip()[:500],
                "hashtags": [f"#{ctx.product_name.replace(' ', '')}"],
                "image_description": f"High-quality photo of {ctx.product_name}",
                "best_posting_time": "6:00 PM local time",
                "engagement_tips": "Ask a question in comments to boost engagement.",
            }

        return SocialPostResult(
            caption=data.get("caption", ""),
            hashtags=data.get("hashtags", []),
            image_description=data.get("image_description", ""),
            best_posting_time=data.get("best_posting_time", ""),
            engagement_tips=data.get("engagement_tips", ""),
        )
