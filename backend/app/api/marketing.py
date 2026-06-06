from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.marketing_campaign import MarketingCampaign
from app.models.marketing_content import MarketingContent
from app.services.marketing_skills.registry import (
    get_campaign_planner,
    get_script_writer,
    get_post_writer,
    get_ad_copy_writer,
    get_audience_analyzer,
    list_available_skills,
)
from app.services.marketing_skills.base import (
    CampaignContext, ScriptContext, PostContext, AdCopyContext, AudienceContext,
)
from app.services.usage import deduct_credits
from app.schemas.marketing import (
    CampaignGenerateRequest, CampaignGenerateResponse, CampaignPlanResponse,
    ScriptGenerateRequest, ScriptGenerateResponse, VideoScriptResponse,
    PostGenerateRequest, PostGenerateResponse, SocialPostResponse,
    AdCopyGenerateRequest, AdCopyGenerateResponse, AdCopyResponse,
    AudienceProfileRequest, AudienceProfileGenerateResponse, AudienceProfileResponse,
    CampaignCreate, CampaignUpdate, CampaignResponse, CampaignDetailResponse,
    CampaignListResponse, ContentResponse, ContentListResponse, ContentLinkRequest,
)

router = APIRouter()

# ───────────────────────────────────────────────────────
#  AI Generation Endpoints
# ───────────────────────────────────────────────────────

@router.get("/skills")
async def list_skills():
    return list_available_skills()


@router.post("/generate-campaign", response_model=CampaignGenerateResponse)
async def generate_campaign(
    req: CampaignGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = CampaignContext(
        product_name=req.product_name,
        product_category=req.product_category,
        features=req.product_features,
        target_market=req.target_market,
        language=req.language,
        objective=req.objective,
    )
    skill = get_campaign_planner()
    try:
        result = await skill.generate(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI generation failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=2.0, api_cost=0.008)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    content = MarketingContent(
        user_id=current_user.id,
        content_type="campaign_plan",
        title=result.theme,
        body=f"**Description:** {result.description}\n\n**Strategy:** {result.content_strategy}\n\n"
             f"**Channels:** {result.channel_recommendations}\n\n**Budget Tier:** {result.estimated_budget_tier}",
        platform="all",
        language=req.language,
        metadata_={"hashtags": result.hashtags, "channel_recommendations": result.channel_recommendations},
    )
    db.add(content)
    db.commit()

    return CampaignGenerateResponse(
        plan=CampaignPlanResponse(
            theme=result.theme,
            description=result.description,
            content_strategy=result.content_strategy,
            channel_recommendations=result.channel_recommendations,
            hashtags=result.hashtags,
            estimated_budget_tier=result.estimated_budget_tier,
        ),
        credits_used=2.0,
    )


@router.post("/generate-script", response_model=ScriptGenerateResponse)
async def generate_script(
    req: ScriptGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = ScriptContext(
        product_name=req.product_name,
        features=req.product_features,
        target_audience=req.target_audience,
        platform=req.platform,
        language=req.language,
        tone=req.tone,
        duration_seconds=req.duration_seconds,
    )
    skill = get_script_writer()
    try:
        result = await skill.generate(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI generation failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=1.0, api_cost=0.004)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    content = MarketingContent(
        user_id=current_user.id,
        content_type="video_script",
        title=result.title,
        body=f"**Hook:** {result.hook}\n\n**CTA:** {result.cta}\n\n**Music:** {result.music_suggestion}",
        platform=req.platform,
        language=req.language,
        metadata_={"scenes": result.scenes, "total_duration_seconds": result.total_duration_seconds},
    )
    db.add(content)
    db.commit()

    return ScriptGenerateResponse(
        script=VideoScriptResponse(
            title=result.title,
            hook=result.hook,
            scenes=result.scenes,
            music_suggestion=result.music_suggestion,
            cta=result.cta,
            total_duration_seconds=result.total_duration_seconds,
        ),
        credits_used=1.0,
    )


@router.post("/generate-post", response_model=PostGenerateResponse)
async def generate_post(
    req: PostGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = PostContext(
        product_name=req.product_name,
        features=req.product_features,
        platform=req.platform,
        language=req.language,
        tone=req.tone,
        key_message=req.key_message,
    )
    skill = get_post_writer()
    try:
        result = await skill.generate(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI generation failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=0.5, api_cost=0.002)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    content = MarketingContent(
        user_id=current_user.id,
        content_type="social_post",
        title=f"Post for {req.platform}",
        body=result.caption,
        platform=req.platform,
        language=req.language,
        metadata_={"hashtags": result.hashtags, "image_description": result.image_description,
                    "best_posting_time": result.best_posting_time, "engagement_tips": result.engagement_tips},
    )
    db.add(content)
    db.commit()

    return PostGenerateResponse(
        post=SocialPostResponse(
            caption=result.caption,
            hashtags=result.hashtags,
            image_description=result.image_description,
            best_posting_time=result.best_posting_time,
            engagement_tips=result.engagement_tips,
        ),
        credits_used=0.5,
    )


@router.post("/generate-ad-copy", response_model=AdCopyGenerateResponse)
async def generate_ad_copy(
    req: AdCopyGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = AdCopyContext(
        product_name=req.product_name,
        features=req.product_features,
        target_market=req.target_market,
        platform=req.platform,
        language=req.language,
        objective=req.objective,
    )
    skill = get_ad_copy_writer()
    try:
        result = await skill.generate(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI generation failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=1.0, api_cost=0.004)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    content = MarketingContent(
        user_id=current_user.id,
        content_type="ad_copy",
        title=f"Ad Copy - {req.platform}",
        body=f"**Headlines:** {' | '.join(result.headlines)}\n\n**Descriptions:** {' | '.join(result.descriptions)}\n\n**CTA:** {result.cta}",
        platform=req.platform,
        language=req.language,
        metadata_={"headlines": result.headlines, "descriptions": result.descriptions,
                    "keywords": result.keywords, "sitelink_suggestions": result.sitelink_suggestions},
    )
    db.add(content)
    db.commit()

    return AdCopyGenerateResponse(
        ad_copy=AdCopyResponse(
            headlines=result.headlines,
            descriptions=result.descriptions,
            cta=result.cta,
            keywords=result.keywords,
            sitelink_suggestions=result.sitelink_suggestions,
        ),
        credits_used=1.0,
    )


@router.post("/audience-profile", response_model=AudienceProfileGenerateResponse)
async def audience_profile(
    req: AudienceProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ctx = AudienceContext(
        product_category=req.product_category,
        target_market=req.target_market,
        interests=req.interests,
        language=req.language,
    )
    skill = get_audience_analyzer()
    try:
        result = await skill.analyze(ctx)
    except Exception as e:
        raise HTTPException(503, f"AI generation failed: {e}")

    try:
        deduct_credits(db, current_user.id, "text_gen", credits_used=1.5, api_cost=0.006)
        db.commit()
    except ValueError as e:
        raise HTTPException(402, str(e))

    content = MarketingContent(
        user_id=current_user.id,
        content_type="audience_profile",
        title=f"Audience Profile - {req.product_category} ({req.target_market})",
        body=f"**Demographics:** {result.demographics}\n\n**Interests:** {', '.join(result.interests_behaviors)}",
        platform="all",
        language=req.language,
        metadata_={
            "demographics": result.demographics,
            "interests_behaviors": result.interests_behaviors,
            "content_preferences": result.content_preferences,
            "platform_usage": result.platform_usage,
            "pain_points": result.pain_points,
            "purchase_motivations": result.purchase_motivations,
        },
    )
    db.add(content)
    db.commit()

    return AudienceProfileGenerateResponse(
        profile=AudienceProfileResponse(
            demographics=result.demographics,
            interests_behaviors=result.interests_behaviors,
            content_preferences=result.content_preferences,
            platform_usage=result.platform_usage,
            pain_points=result.pain_points,
            purchase_motivations=result.purchase_motivations,
        ),
        credits_used=1.5,
    )


# ───────────────────────────────────────────────────────
#  Campaign CRUD
# ───────────────────────────────────────────────────────

@router.get("/campaigns", response_model=CampaignListResponse)
async def list_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status: str | None = Query(None, pattern=r"^(draft|active|completed)$"),
):
    q = db.query(MarketingCampaign).filter_by(user_id=current_user.id)
    if status:
        q = q.filter_by(status=status)
    campaigns = q.order_by(MarketingCampaign.updated_at.desc()).all()

    items = []
    for c in campaigns:
        count = db.query(MarketingContent).filter_by(campaign_id=c.id).count()
        items.append(CampaignResponse(
            id=c.id, name=c.name, description=c.description,
            target_market=c.target_market, target_audience=c.target_audience,
            objective=c.objective, status=c.status,
            created_at=c.created_at, updated_at=c.updated_at,
            content_count=count,
        ))

    return CampaignListResponse(campaigns=items, total=len(items))


@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(
    req: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = MarketingCampaign(
        user_id=current_user.id,
        name=req.name,
        description=req.description,
        target_market=req.target_market,
        target_audience=req.target_audience,
        objective=req.objective,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return CampaignResponse(
        id=campaign.id, name=campaign.name, description=campaign.description,
        target_market=campaign.target_market, target_audience=campaign.target_audience,
        objective=campaign.objective, status=campaign.status,
        created_at=campaign.created_at, updated_at=campaign.updated_at,
        content_count=0,
    )


@router.get("/campaigns/{campaign_id}", response_model=CampaignDetailResponse)
async def get_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = db.query(MarketingCampaign).filter_by(id=campaign_id, user_id=current_user.id).first()
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    contents = db.query(MarketingContent).filter_by(campaign_id=campaign_id).order_by(MarketingContent.created_at.desc()).all()
    content_responses = [
        ContentResponse(
            id=c.id, campaign_id=c.campaign_id, content_type=c.content_type,
            title=c.title, body=c.body, platform=c.platform, language=c.language,
            metadata_=c.metadata_, created_at=c.created_at,
        ) for c in contents
    ]

    return CampaignDetailResponse(
        id=campaign.id, name=campaign.name, description=campaign.description,
        target_market=campaign.target_market, target_audience=campaign.target_audience,
        objective=campaign.objective, status=campaign.status,
        created_at=campaign.created_at, updated_at=campaign.updated_at,
        content_count=len(content_responses),
        contents=content_responses,
    )


@router.put("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    req: CampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = db.query(MarketingCampaign).filter_by(id=campaign_id, user_id=current_user.id).first()
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(campaign, key, value)
    db.commit()
    db.refresh(campaign)

    count = db.query(MarketingContent).filter_by(campaign_id=campaign.id).count()
    return CampaignResponse(
        id=campaign.id, name=campaign.name, description=campaign.description,
        target_market=campaign.target_market, target_audience=campaign.target_audience,
        objective=campaign.objective, status=campaign.status,
        created_at=campaign.created_at, updated_at=campaign.updated_at,
        content_count=count,
    )


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = db.query(MarketingCampaign).filter_by(id=campaign_id, user_id=current_user.id).first()
    if not campaign:
        raise HTTPException(404, "Campaign not found")
    db.query(MarketingContent).filter_by(campaign_id=campaign_id).update({"campaign_id": None})
    db.delete(campaign)
    db.commit()
    return {"status": "deleted"}


# ───────────────────────────────────────────────────────
#  Content CRUD
# ───────────────────────────────────────────────────────

@router.get("/contents", response_model=ContentListResponse)
async def list_contents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    content_type: str | None = Query(None),
    platform: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    q = db.query(MarketingContent).filter_by(user_id=current_user.id)
    if content_type:
        q = q.filter_by(content_type=content_type)
    if platform:
        q = q.filter_by(platform=platform)
    total = q.count()
    contents = q.order_by(MarketingContent.created_at.desc()).offset(offset).limit(limit).all()

    items = [
        ContentResponse(
            id=c.id, campaign_id=c.campaign_id, content_type=c.content_type,
            title=c.title, body=c.body, platform=c.platform, language=c.language,
            metadata_=c.metadata_, created_at=c.created_at,
        ) for c in contents
    ]
    return ContentListResponse(contents=items, total=total)


@router.get("/contents/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = db.query(MarketingContent).filter_by(id=content_id, user_id=current_user.id).first()
    if not content:
        raise HTTPException(404, "Content not found")
    return ContentResponse(
        id=content.id, campaign_id=content.campaign_id, content_type=content.content_type,
        title=content.title, body=content.body, platform=content.platform, language=content.language,
        metadata_=content.metadata_, created_at=content.created_at,
    )


@router.delete("/contents/{content_id}")
async def delete_content(
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = db.query(MarketingContent).filter_by(id=content_id, user_id=current_user.id).first()
    if not content:
        raise HTTPException(404, "Content not found")
    db.delete(content)
    db.commit()
    return {"status": "deleted"}


@router.post("/contents/{content_id}/link", response_model=ContentResponse)
async def link_content_to_campaign(
    content_id: str,
    req: ContentLinkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = db.query(MarketingContent).filter_by(id=content_id, user_id=current_user.id).first()
    if not content:
        raise HTTPException(404, "Content not found")

    campaign = db.query(MarketingCampaign).filter_by(id=req.campaign_id, user_id=current_user.id).first()
    if not campaign:
        raise HTTPException(404, "Campaign not found")

    content.campaign_id = req.campaign_id
    db.commit()
    db.refresh(content)

    return ContentResponse(
        id=content.id, campaign_id=content.campaign_id, content_type=content.content_type,
        title=content.title, body=content.body, platform=content.platform, language=content.language,
        metadata_=content.metadata_, created_at=content.created_at,
    )
