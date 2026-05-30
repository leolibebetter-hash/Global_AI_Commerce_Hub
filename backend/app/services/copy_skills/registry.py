from app.core.config import settings
from app.services.copy_skills.base import TitleSkill, BulletSkill, DescriptionSkill, KeywordSkill


def get_title_skill(provider: str | None = None) -> TitleSkill:
    provider = provider or settings.copy_provider
    if provider == "deepseek":
        from app.services.copy_skills.deepseek_title import DeepSeekTitleSkill
        return DeepSeekTitleSkill()
    raise ValueError(f"Unknown title provider: {provider}")


def get_bullet_skill(provider: str | None = None) -> BulletSkill:
    provider = provider or settings.copy_provider
    if provider == "deepseek":
        from app.services.copy_skills.deepseek_bullet import DeepSeekBulletSkill
        return DeepSeekBulletSkill()
    raise ValueError(f"Unknown bullet provider: {provider}")


def get_description_skill(provider: str | None = None) -> DescriptionSkill:
    provider = provider or settings.copy_provider
    if provider == "deepseek":
        from app.services.copy_skills.deepseek_description import DeepSeekDescriptionSkill
        return DeepSeekDescriptionSkill()
    raise ValueError(f"Unknown description provider: {provider}")


def get_keyword_skill(provider: str | None = None) -> KeywordSkill:
    provider = provider or settings.copy_provider
    if provider == "deepseek":
        from app.services.copy_skills.deepseek_keyword import DeepSeekKeywordSkill
        return DeepSeekKeywordSkill()
    if provider == "mock":
        from app.services.copy_skills.mock_keyword import MockKeywordSkill
        return MockKeywordSkill()
    raise ValueError(f"Unknown keyword provider: {provider}")


def list_available_skills() -> dict:
    return {
        "title": ["deepseek"],
        "bullet": ["deepseek"],
        "description": ["deepseek"],
        "keyword": ["deepseek", "mock"],
    }
