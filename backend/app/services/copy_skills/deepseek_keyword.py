import json
import re

from app.services.copy_skills.base import ProductContext, KeywordResult, KeywordSkill
from app.services.deepseek import chat


class DeepSeekKeywordSkill(KeywordSkill):
    async def recommend(self, ctx: ProductContext) -> KeywordResult:
        market_hints = {
            "US": "Focus on English keywords relevant to Amazon.com US search patterns, including long-tail variations.",
            "UK": "Focus on British English spelling and UK-specific search terms commonly used on Amazon.co.uk.",
            "DE": "Generate keywords in German. Include compound nouns, technical terms, and certifications German shoppers search for.",
            "JP": "Generate keywords in Japanese. Include both Kanji and Katakana variations where applicable.",
            "FR": "Generate keywords in French. Include gendered variations and French e-commerce search patterns.",
            "CA": "Focus on English keywords (Amazon.ca). Include some French keywords if the category warrants bilingual listing.",
            "AU": "Focus on Australian English terms. Include local slang and seasonal variations (Southern Hemisphere seasons).",
        }
        hint = market_hints.get(ctx.target_market, market_hints["US"])

        system = (
            "You are an Amazon keyword research specialist. "
            f"{hint} "
            "Return a JSON array of 25-30 keyword objects in the target market's language. "
            "Each object has: keyword (str), search_volume (\"high\"|\"medium\"|\"low\"), "
            "competition (\"high\"|\"medium\"|\"low\"), implanted (bool). "
            "Return ONLY valid JSON, no other text."
        )

        features_text = ", ".join(ctx.features) if ctx.features else "N/A"
        provided_keywords = ", ".join(ctx.keywords) if ctx.keywords else "N/A"

        prompt = (
            f"Product: {ctx.product_name}\n"
            f"Category: {ctx.category}\n"
            f"Features: {features_text}\n"
            f"Target Market: {ctx.target_market}\n"
            f"Language: {ctx.language}\n"
            f"Provided Keywords: {provided_keywords}\n\n"
            f"Generate 25-30 relevant Amazon keywords in {ctx.language} as a JSON array. "
            f"Mark keywords as implanted: true if they appear in the provided keywords list."
        )

        result = chat(prompt, system, max_tokens=2048)
        keywords = self._parse_keywords(result)
        return KeywordResult(keywords=keywords)

    def _parse_keywords(self, raw: str) -> list[dict]:
        # Try JSON parse first
        text = raw.strip()
        # Remove ```json ... ``` fences if present
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

        try:
            data = json.loads(text)
            if isinstance(data, list):
                return self._validate_keywords(data)
        except json.JSONDecodeError:
            pass

        # Fallback: try to find JSON array in the text
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
                if isinstance(data, list):
                    return self._validate_keywords(data)
            except (json.JSONDecodeError, ValueError):
                pass

        return []

    def _validate_keywords(self, data: list) -> list[dict]:
        validated = []
        for item in data:
            if isinstance(item, dict) and "keyword" in item:
                validated.append({
                    "keyword": str(item["keyword"]),
                    "search_volume": str(item.get("search_volume", "medium")),
                    "competition": str(item.get("competition", "medium")),
                    "implanted": bool(item.get("implanted", False)),
                })
        return validated[:30]
