import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { apiFetch } from "../lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabKey = "campaign" | "content" | "audience";

interface CampaignPlan {
  theme: string;
  description: string;
  content_strategy: string;
  channel_recommendations: { platform: string; reason: string; content_type: string }[];
  hashtags: string[];
  estimated_budget_tier: string;
}

interface VideoScript {
  title: string;
  hook: string;
  scenes: { time: string; visual: string; narration: string; text_overlay: string }[];
  music_suggestion: string;
  cta: string;
  total_duration_seconds: number;
}

interface SocialPost {
  caption: string;
  hashtags: string[];
  image_description: string;
  best_posting_time: string;
  engagement_tips: string;
}

interface AdCopy {
  headlines: string[];
  descriptions: string[];
  cta: string;
  keywords: { keyword: string; match_type: string }[];
  sitelink_suggestions: string[];
}

interface AudienceProfile {
  demographics: Record<string, string>;
  interests_behaviors: string[];
  content_preferences: string[];
  platform_usage: Record<string, string[]>;
  pain_points: string[];
  purchase_motivations: string[];
}

interface CampaignItem {
  id: string;
  name: string;
  description: string | null;
  target_market: string;
  objective: string;
  status: string;
  content_count: number;
  created_at: string;
}

interface ContentItem {
  id: string;
  campaign_id: string | null;
  content_type: string;
  title: string;
  body: string;
  platform: string;
  language: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MARKETS = ["US", "UK", "DE", "JP"];
const LANGUAGES = ["en", "zh", "de", "ja"];
const OBJECTIVES = ["brand_awareness", "conversion", "engagement"];
const TONES = ["energetic", "professional", "casual", "humorous", "emotional"];
const PLATFORMS_SCRIPT = ["tiktok", "youtube_shorts", "instagram_reels"];
const PLATFORMS_POST = ["instagram", "facebook", "twitter", "pinterest"];
const PLATFORMS_AD = ["google_ads", "bing_ads"];

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: "campaign", labelKey: "marketing.tabs.campaign" },
  { key: "content", labelKey: "marketing.tabs.content" },
  { key: "audience", labelKey: "marketing.tabs.audience" },
];

/* ------------------------------------------------------------------ */
/*  Helper: Copy to clipboard                                          */
/* ------------------------------------------------------------------ */

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function MarketingHub() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("campaign");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- Campaign Planner State ------------------------------------ */
  const [cpProductName, setCpProductName] = useState("");
  const [cpCategory, setCpCategory] = useState("");
  const [cpFeatures, setCpFeatures] = useState<string[]>([]);
  const [cpFeatureInput, setCpFeatureInput] = useState("");
  const [cpMarket, setCpMarket] = useState("US");
  const [cpLanguage, setCpLanguage] = useState("en");
  const [cpObjective, setCpObjective] = useState("brand_awareness");
  const [campaignResult, setCampaignResult] = useState<CampaignPlan | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);

  /* ---- Content Creator State ------------------------------------- */
  const [contentType, setContentType] = useState<"script" | "post" | "ad">("script");
  const [ccProductName, setCcProductName] = useState("");
  const [ccFeatures, setCcFeatures] = useState<string[]>([]);
  const [ccFeatureInput, setCcFeatureInput] = useState("");
  const [ccPlatform, setCcPlatform] = useState("tiktok");
  const [ccLanguage, setCcLanguage] = useState("en");
  const [ccTone, setCcTone] = useState("energetic");
  const [ccDuration, setCcDuration] = useState(30);
  const [ccKeyMessage, setCcKeyMessage] = useState("");
  const [ccAudience, setCcAudience] = useState("general");
  const [ccMarket, setCcMarket] = useState("US");
  const [ccObjective, setCcObjective] = useState("conversion");
  const [scriptResult, setScriptResult] = useState<VideoScript | null>(null);
  const [postResult, setPostResult] = useState<SocialPost | null>(null);
  const [adResult, setAdResult] = useState<AdCopy | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [contentsLoaded, setContentsLoaded] = useState(false);

  /* ---- Audience Analysis State ----------------------------------- */
  const [apCategory, setApCategory] = useState("");
  const [apMarket, setApMarket] = useState("US");
  const [apInterests, setApInterests] = useState<string[]>([]);
  const [apInterestInput, setApInterestInput] = useState("");
  const [apLanguage, setApLanguage] = useState("en");
  const [audienceResult, setAudienceResult] = useState<AudienceProfile | null>(null);

  /* ---- Generic handlers ------------------------------------------ */

  function handleFeatureKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    current: string,
    setter: (v: string) => void,
    list: string[],
    listSetter: (v: string[]) => void,
  ) {
    if (e.key === "Enter" && current.trim()) {
      e.preventDefault();
      listSetter([...list, current.trim()]);
      setter("");
    }
  }

  function removeFeature(idx: number, list: string[], listSetter: (v: string[]) => void) {
    listSetter(list.filter((_, i) => i !== idx));
  }

  /* ---- Campaign Planner: generate -------------------------------- */

  async function handleGenerateCampaign() {
    if (!cpProductName || !cpCategory) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ plan: CampaignPlan }>("/api/marketing/generate-campaign", {
        method: "POST",
        body: JSON.stringify({
          product_name: cpProductName,
          product_category: cpCategory,
          product_features: cpFeatures,
          target_market: cpMarket,
          language: cpLanguage,
          objective: cpObjective,
        }),
      });
      setCampaignResult(data.plan);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadCampaigns() {
    try {
      const data = await apiFetch<{ campaigns: CampaignItem[] }>("/api/marketing/campaigns");
      setCampaigns(data.campaigns);
      setCampaignsLoaded(true);
    } catch { /* ignore */ }
  }

  /* ---- Content Creator: generate --------------------------------- */

  async function handleGenerateScript() {
    if (!ccProductName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ script: VideoScript }>("/api/marketing/generate-script", {
        method: "POST",
        body: JSON.stringify({
          product_name: ccProductName,
          product_features: ccFeatures,
          target_audience: ccAudience,
          platform: ccPlatform,
          language: ccLanguage,
          tone: ccTone,
          duration_seconds: ccDuration,
        }),
      });
      setScriptResult(data.script);
      setPostResult(null);
      setAdResult(null);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePost() {
    if (!ccProductName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ post: SocialPost }>("/api/marketing/generate-post", {
        method: "POST",
        body: JSON.stringify({
          product_name: ccProductName,
          product_features: ccFeatures,
          platform: ccPlatform,
          language: ccLanguage,
          tone: ccTone,
          key_message: ccKeyMessage,
        }),
      });
      setPostResult(data.post);
      setScriptResult(null);
      setAdResult(null);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAd() {
    if (!ccProductName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ ad_copy: AdCopy }>("/api/marketing/generate-ad-copy", {
        method: "POST",
        body: JSON.stringify({
          product_name: ccProductName,
          product_features: ccFeatures,
          target_market: ccMarket,
          platform: ccPlatform,
          language: ccLanguage,
          objective: ccObjective,
        }),
      });
      setAdResult(data.ad_copy);
      setScriptResult(null);
      setPostResult(null);
    } catch (e: any) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadContents() {
    try {
      const data = await apiFetch<{ contents: ContentItem[] }>("/api/marketing/contents");
      setContents(data.contents);
      setContentsLoaded(true);
    } catch { /* ignore */ }
  }

  /* ---- Audience: analyze ----------------------------------------- */

  async function handleAnalyzeAudience() {
    if (!apCategory) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ profile: AudienceProfile }>("/api/marketing/audience-profile", {
        method: "POST",
        body: JSON.stringify({
          product_category: apCategory,
          target_market: apMarket,
          interests: apInterests,
          language: apLanguage,
        }),
      });
      setAudienceResult(data.profile);
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  /* ---- Render: common form controls ------------------------------ */

  function renderFeatureTags(features: string[], onRemove: (i: number) => void) {
    if (features.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {features.map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary-light text-primary">
            {f}
            <button onClick={() => onRemove(i)} className="hover:text-red-500">&times;</button>
          </span>
        ))}
      </div>
    );
  }

  function renderSelect(label: string, value: string, options: string[], onChange: (v: string) => void) {
    return (
      <div>
        <label className="block text-sm font-medium text-content/70 mb-1">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-edge px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }

  /* ---- Render: Campaign Tab -------------------------------------- */

  function renderCampaignTab() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("marketing.campaign.title")}</h2>
          <div className="space-y-4">
            <Input label={t("marketing.campaign.product_name")} value={cpProductName} onChange={(e) => setCpProductName(e.target.value)} />
            <Input label={t("marketing.campaign.category")} value={cpCategory} onChange={(e) => setCpCategory(e.target.value)} />
            <div>
              <Input
                label={t("marketing.campaign.features")}
                value={cpFeatureInput}
                onChange={(e) => setCpFeatureInput(e.target.value)}
                onKeyDown={(e) => handleFeatureKeyDown(e, cpFeatureInput, setCpFeatureInput, cpFeatures, setCpFeatures)}
                placeholder={t("marketing.campaign.features_hint")}
              />
              {renderFeatureTags(cpFeatures, (i) => removeFeature(i, cpFeatures, setCpFeatures))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("marketing.campaign.market"), cpMarket, MARKETS, setCpMarket)}
              {renderSelect(t("marketing.campaign.language"), cpLanguage, LANGUAGES, setCpLanguage)}
            </div>
            {renderSelect(t("marketing.campaign.objective"), cpObjective, OBJECTIVES, setCpObjective)}
            <Button onClick={handleGenerateCampaign} loading={loading} className="w-full">
              {t("marketing.campaign.generate")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        {/* Result */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("marketing.campaign.result")}</h2>
          {campaignResult ? (
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.theme")}</span>
                <p className="text-lg font-bold text-primary">{campaignResult.theme}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.description")}</span>
                <p className="text-sm">{campaignResult.description}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.strategy")}</span>
                <p className="text-sm">{campaignResult.content_strategy}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.channels")}</span>
                <div className="space-y-1 mt-1">
                  {campaignResult.channel_recommendations.map((ch, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded bg-primary-light text-primary text-xs font-medium">{ch.platform}</span>
                      <span>{ch.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.hashtags")}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {campaignResult.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-blue-600">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-content/70">{t("marketing.campaign.budget")}:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  campaignResult.estimated_budget_tier === "low" ? "bg-green-100 text-green-800" :
                  campaignResult.estimated_budget_tier === "high" ? "bg-red-100 text-red-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {campaignResult.estimated_budget_tier}
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(JSON.stringify(campaignResult, null, 2))}>
                {t("marketing.actions.copy")}
              </Button>
            </div>
          ) : (
            <p className="text-content/50 text-sm">{t("marketing.campaign.placeholder")}</p>
          )}
        </Card>

        {/* Campaign List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{t("marketing.campaign.list_title")}</h3>
            <Button variant="secondary" size="sm" onClick={loadCampaigns}>{t("marketing.actions.refresh")}</Button>
          </div>
          {campaignsLoaded && campaigns.length === 0 && (
            <p className="text-content/50 text-sm">{t("marketing.campaign.no_campaigns")}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {campaigns.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{c.name}</h4>
                    <p className="text-xs text-content/50 mt-1">{c.objective} &middot; {c.target_market} &middot; {c.content_count} {t("marketing.campaign.contents")}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    c.status === "active" ? "bg-green-100 text-green-800" :
                    c.status === "completed" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-600"
                  }`}>{c.status}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---- Render: Content Tab --------------------------------------- */

  function renderContentTab() {
    const platforms = contentType === "script" ? PLATFORMS_SCRIPT : contentType === "post" ? PLATFORMS_POST : PLATFORMS_AD;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">{t("marketing.content.title")}</h2>
          </div>

          {/* Content type toggle */}
          <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg">
            {(["script", "post", "ad"] as const).map((ct) => (
              <button
                key={ct}
                onClick={() => { setContentType(ct); setScriptResult(null); setPostResult(null); setAdResult(null); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  contentType === ct ? "bg-white shadow text-primary" : "text-content/60 hover:text-content"
                }`}
              >
                {t(`marketing.content.types.${ct}`)}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <Input label={t("marketing.content.product_name")} value={ccProductName} onChange={(e) => setCcProductName(e.target.value)} />
            <div>
              <Input
                label={t("marketing.content.features")}
                value={ccFeatureInput}
                onChange={(e) => setCcFeatureInput(e.target.value)}
                onKeyDown={(e) => handleFeatureKeyDown(e, ccFeatureInput, setCcFeatureInput, ccFeatures, setCcFeatures)}
                placeholder={t("marketing.content.features_hint")}
              />
              {renderFeatureTags(ccFeatures, (i) => removeFeature(i, ccFeatures, setCcFeatures))}
            </div>

            {contentType === "script" && (
              <>
                <Input label={t("marketing.content.audience")} value={ccAudience} onChange={(e) => setCcAudience(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-content/70 mb-1">{t("marketing.content.duration")}</label>
                    <input type="number" min={15} max={180} step={5} value={ccDuration}
                      onChange={(e) => setCcDuration(Number(e.target.value))}
                      className="w-full rounded-lg border border-edge px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  {renderSelect(t("marketing.content.tone"), ccTone, TONES, setCcTone)}
                </div>
              </>
            )}

            {contentType === "post" && (
              <Input label={t("marketing.content.key_message")} value={ccKeyMessage} onChange={(e) => setCcKeyMessage(e.target.value)} />
            )}

            {contentType === "ad" && (
              <div className="grid grid-cols-2 gap-3">
                {renderSelect(t("marketing.content.market"), ccMarket, MARKETS, setCcMarket)}
                {renderSelect(t("marketing.content.objective"), ccObjective, ["conversion", "traffic", "brand_awareness"], setCcObjective)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("marketing.content.platform"), ccPlatform, platforms, setCcPlatform)}
              {renderSelect(t("marketing.content.language"), ccLanguage, LANGUAGES, setCcLanguage)}
            </div>

            {contentType !== "ad" && renderSelect(t("marketing.content.tone"), ccTone, TONES, setCcTone)}

            <Button
              onClick={contentType === "script" ? handleGenerateScript : contentType === "post" ? handleGeneratePost : handleGenerateAd}
              loading={loading}
              className="w-full"
            >
              {t("marketing.content.generate")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        {/* Result */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("marketing.content.result")}</h2>

          {scriptResult && (
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.script_title")}</span>
                <p className="font-semibold">{scriptResult.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.hook")}</span>
                <p className="text-sm italic bg-yellow-50 p-2 rounded">{scriptResult.hook}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.scenes")}</span>
                {scriptResult.scenes.map((s, i) => (
                  <div key={i} className="mt-1 p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium text-primary">{s.time}</span>
                    <p><span className="text-content/50">{t("marketing.content.visual")}:</span> {s.visual}</p>
                    <p><span className="text-content/50">{t("marketing.content.narration")}:</span> {s.narration}</p>
                    {s.text_overlay && <p><span className="text-content/50">{t("marketing.content.overlay")}:</span> {s.text_overlay}</p>}
                  </div>
                ))}
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.music")}</span>
                <p className="text-sm">{scriptResult.music_suggestion}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">CTA</span>
                <p className="text-sm font-semibold text-green-700">{scriptResult.cta}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(JSON.stringify(scriptResult, null, 2))}>
                {t("marketing.actions.copy")}
              </Button>
            </div>
          )}

          {postResult && (
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.caption")}</span>
                <p className="text-sm whitespace-pre-wrap">{postResult.caption}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.hashtags")}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {postResult.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-blue-600">{tag}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.image_hint")}</span>
                <p className="text-sm">{postResult.image_description}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.best_time")}</span>
                <p className="text-sm">{postResult.best_posting_time}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.engagement_tips")}</span>
                <p className="text-sm">{postResult.engagement_tips}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(postResult.caption)}>
                {t("marketing.actions.copy_caption")}
              </Button>
            </div>
          )}

          {adResult && (
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.headlines")}</span>
                {adResult.headlines.map((h, i) => (
                  <p key={i} className="text-sm font-medium">• {h}</p>
                ))}
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.descriptions")}</span>
                {adResult.descriptions.map((d, i) => (
                  <p key={i} className="text-sm">• {d}</p>
                ))}
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">CTA</span>
                <p className="text-sm font-semibold text-green-700">{adResult.cta}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.content.keywords")}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {adResult.keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-xs bg-gray-100">
                      {kw.keyword} <span className="text-content/50">({kw.match_type})</span>
                    </span>
                  ))}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(JSON.stringify(adResult, null, 2))}>
                {t("marketing.actions.copy")}
              </Button>
            </div>
          )}

          {!scriptResult && !postResult && !adResult && (
            <p className="text-content/50 text-sm">{t("marketing.content.placeholder")}</p>
          )}
        </Card>

        {/* Recent Contents */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{t("marketing.content.recent")}</h3>
            <Button variant="secondary" size="sm" onClick={loadContents}>{t("marketing.actions.refresh")}</Button>
          </div>
          <div className="space-y-2">
            {contents.slice(0, 10).map((c) => (
              <Card key={c.id} className="p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary-light text-primary font-medium">{c.content_type}</span>
                  <span className="ml-2 text-sm font-medium">{c.title}</span>
                  <span className="ml-2 text-xs text-content/50">{c.platform} &middot; {c.language}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => copyToClipboard(c.body)}>
                  {t("marketing.actions.copy")}
                </Button>
              </Card>
            ))}
            {contentsLoaded && contents.length === 0 && (
              <p className="text-content/50 text-sm">{t("marketing.content.no_content")}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---- Render: Audience Tab -------------------------------------- */

  function renderAudienceTab() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("marketing.audience.title")}</h2>
          <div className="space-y-4">
            <Input label={t("marketing.audience.category")} value={apCategory} onChange={(e) => setApCategory(e.target.value)} />
            <div>
              <Input
                label={t("marketing.audience.interests")}
                value={apInterestInput}
                onChange={(e) => setApInterestInput(e.target.value)}
                onKeyDown={(e) => handleFeatureKeyDown(e, apInterestInput, setApInterestInput, apInterests, setApInterests)}
                placeholder={t("marketing.audience.interests_hint")}
              />
              {renderFeatureTags(apInterests, (i) => removeFeature(i, apInterests, setApInterests))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("marketing.audience.market"), apMarket, MARKETS, setApMarket)}
              {renderSelect(t("marketing.audience.language"), apLanguage, LANGUAGES, setApLanguage)}
            </div>
            <Button onClick={handleAnalyzeAudience} loading={loading} className="w-full">
              {t("marketing.audience.analyze")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        {/* Result */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("marketing.audience.result")}</h2>
          {audienceResult ? (
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.demographics")}</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {Object.entries(audienceResult.demographics).map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded p-2">
                      <span className="text-xs text-content/50 capitalize">{k.replace("_", " ")}</span>
                      <p className="text-sm font-medium">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.interests")}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {audienceResult.interests_behaviors.map((item, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{item}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.content_prefs")}</span>
                <ul className="list-disc list-inside text-sm">
                  {audienceResult.content_preferences.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.platform_usage")}</span>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs font-medium text-content/50">{t("marketing.audience.primary")}:</span>
                    {(audienceResult.platform_usage.primary || []).map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">{p}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs font-medium text-content/50">{t("marketing.audience.secondary")}:</span>
                    {(audienceResult.platform_usage.secondary || []).map((p, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.pain_points")}</span>
                <ul className="list-disc list-inside text-sm">
                  {audienceResult.pain_points.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-sm font-medium text-content/70">{t("marketing.audience.motivations")}</span>
                <ul className="list-disc list-inside text-sm">
                  {audienceResult.purchase_motivations.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(JSON.stringify(audienceResult, null, 2))}>
                {t("marketing.actions.copy")}
              </Button>
            </div>
          ) : (
            <p className="text-content/50 text-sm">{t("marketing.audience.placeholder")}</p>
          )}
        </Card>
      </div>
    );
  }

  /* ---- Render: Main ---------------------------------------------- */

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{t("marketing.title")}</h1>
        <p className="text-sm text-content/50 mt-1">{t("marketing.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key ? "bg-white shadow text-primary" : "text-content/60 hover:text-content"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {activeTab === "campaign" && renderCampaignTab()}
      {activeTab === "content" && renderContentTab()}
      {activeTab === "audience" && renderAudienceTab()}
    </div>
  );
}
