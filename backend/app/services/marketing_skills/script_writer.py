import json
from app.services.marketing_skills.base import ScriptContext, VideoScriptResult, ScriptWriterSkill
from app.services.deepseek import chat


class DeepSeekScriptWriter(ScriptWriterSkill):
    async def generate(self, ctx: ScriptContext) -> VideoScriptResult:
        system = (
            "You are a viral short-video script writer for social media platforms. "
            "Create engaging, platform-optimized scripts with strong hooks. "
            "Respond ONLY with valid JSON — no markdown, no explanation outside the JSON."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        prompt = (
            f"Write a {ctx.duration_seconds}s {ctx.platform} video script:\n"
            f"Product: {ctx.product_name}\n"
            f"Features: {features_text}\n"
            f"Target Audience: {ctx.target_audience}\n"
            f"Tone: {ctx.tone}\n"
            f"Language: {ctx.language}\n\n"
            f"Return JSON with these keys:\n"
            f'{{"title": "video title",\n'
            f' "hook": "first 3-second hook to grab attention",\n'
            f' "scenes": [{{"time": "0-5s", "visual": "...", "narration": "...", "text_overlay": "..."}}],\n'
            f' "music_suggestion": "genre/mood recommendation",\n'
            f' "cta": "call to action",\n'
            f' "total_duration_seconds": {ctx.duration_seconds}}}'
        )

        result = chat(prompt, system, max_tokens=1024)
        try:
            data = json.loads(result.strip().removeprefix("```json").removesuffix("```").strip())
        except json.JSONDecodeError:
            data = {
                "title": f"{ctx.product_name} - Must Have!",
                "hook": f"Check out the new {ctx.product_name}!",
                "scenes": [{"time": f"0-{ctx.duration_seconds}s", "visual": "Product showcase", "narration": result.strip()[:300], "text_overlay": ctx.product_name}],
                "music_suggestion": "Upbeat pop",
                "cta": "Link in bio!",
                "total_duration_seconds": ctx.duration_seconds,
            }

        return VideoScriptResult(
            title=data.get("title", ""),
            hook=data.get("hook", ""),
            scenes=data.get("scenes", []),
            music_suggestion=data.get("music_suggestion", ""),
            cta=data.get("cta", ""),
            total_duration_seconds=data.get("total_duration_seconds", ctx.duration_seconds),
        )
