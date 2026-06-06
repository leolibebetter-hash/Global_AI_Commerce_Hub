from app.core.config import settings
from app.services.marketing_skills.base import (
    CampaignPlannerSkill,
    ScriptWriterSkill,
    PostWriterSkill,
    AdCopyWriterSkill,
    AudienceAnalyzerSkill,
)


def _provider() -> str:
    return getattr(settings, "marketing_provider", "deepseek") or "deepseek"


def get_campaign_planner(provider: str | None = None) -> CampaignPlannerSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.marketing_skills.campaign_planner import DeepSeekCampaignPlanner
        return DeepSeekCampaignPlanner()
    raise ValueError(f"Unknown campaign planner provider: {provider}")


def get_script_writer(provider: str | None = None) -> ScriptWriterSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.marketing_skills.script_writer import DeepSeekScriptWriter
        return DeepSeekScriptWriter()
    raise ValueError(f"Unknown script writer provider: {provider}")


def get_post_writer(provider: str | None = None) -> PostWriterSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.marketing_skills.post_writer import DeepSeekPostWriter
        return DeepSeekPostWriter()
    raise ValueError(f"Unknown post writer provider: {provider}")


def get_ad_copy_writer(provider: str | None = None) -> AdCopyWriterSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.marketing_skills.ad_copy_writer import DeepSeekAdCopyWriter
        return DeepSeekAdCopyWriter()
    raise ValueError(f"Unknown ad copy writer provider: {provider}")


def get_audience_analyzer(provider: str | None = None) -> AudienceAnalyzerSkill:
    provider = provider or _provider()
    if provider == "deepseek":
        from app.services.marketing_skills.audience_analyzer import DeepSeekAudienceAnalyzer
        return DeepSeekAudienceAnalyzer()
    raise ValueError(f"Unknown audience analyzer provider: {provider}")


def list_available_skills() -> dict:
    return {
        "campaign_planner": ["deepseek"],
        "script_writer": ["deepseek"],
        "post_writer": ["deepseek"],
        "ad_copy_writer": ["deepseek"],
        "audience_analyzer": ["deepseek"],
    }
