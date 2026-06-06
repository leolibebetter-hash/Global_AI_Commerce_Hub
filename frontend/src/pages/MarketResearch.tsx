import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { apiFetch } from "../lib/api";

type TabKey = "trending" | "keywords" | "competitors";

interface ResearchResult {
  id: string;
  analysis_type: string;
  title: string;
  summary: string;
  body: string;
  structured_data: Record<string, any> | null;
  market: string;
  platform: string;
  credits_used: number;
  created_at: string;
}

const MARKETS = ["US", "UK", "DE", "JP"];
const LANGUAGES = ["en", "zh", "de", "ja"];
const PLATFORMS = ["amazon", "ebay", "tiktok_shop", "all"];

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: "trending", labelKey: "market_research.tabs.trending" },
  { key: "keywords", labelKey: "market_research.tabs.keywords" },
  { key: "competitors", labelKey: "market_research.tabs.competitors" },
];

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
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </div>
  );
}

function MarkdownBody({ body }: { body: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-content/80"
      dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, "<br/>").replace(/## (.+)/g, "<h3 class='text-lg font-semibold mt-4 mb-2'>$1</h3>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
    />
  );
}

export function MarketResearch() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("trending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- Trending State ---- */
  const [trCategory, setTrCategory] = useState("");
  const [trMarket, setTrMarket] = useState("US");
  const [trPlatform, setTrPlatform] = useState("amazon");
  const [trLanguage, setTrLanguage] = useState("en");
  const [trendingResult, setTrendingResult] = useState<ResearchResult | null>(null);

  /* ---- Keywords State ---- */
  const [kwCategory, setKwCategory] = useState("");
  const [kwSeeds, setKwSeeds] = useState<string[]>([]);
  const [kwSeedInput, setKwSeedInput] = useState("");
  const [kwMarket, setKwMarket] = useState("US");
  const [kwLanguage, setKwLanguage] = useState("en");
  const [keywordResult, setKeywordResult] = useState<ResearchResult | null>(null);

  /* ---- Competitors State ---- */
  const [cpName, setCpName] = useState("");
  const [cpFeatures, setCpFeatures] = useState<string[]>([]);
  const [cpFeatureInput, setCpFeatureInput] = useState("");
  const [cpMarket, setCpMarket] = useState("US");
  const [cpPlatform, setCpPlatform] = useState("amazon");
  const [cpLanguage, setCpLanguage] = useState("en");
  const [competitorResult, setCompetitorResult] = useState<ResearchResult | null>(null);

  /* ---- History ---- */
  const [history, setHistory] = useState<ResearchResult[]>([]);
  const [historyTab, setHistoryTab] = useState<TabKey>("trending");

  /* ---- Handlers ---- */

  async function handleAnalyzeTrending() {
    if (!trCategory) return;
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<{ result: ResearchResult }>("/api/market-research/analyze-trending", {
        method: "POST",
        body: JSON.stringify({ category: trCategory, market: trMarket, platform: trPlatform, language: trLanguage }),
      });
      setTrendingResult(data.result);
    } catch (e: any) { setError(e.message || "Analysis failed"); }
    finally { setLoading(false); }
  }

  async function handleAnalyzeKeywords() {
    if (!kwCategory) return;
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<{ result: ResearchResult }>("/api/market-research/analyze-keywords", {
        method: "POST",
        body: JSON.stringify({ product_category: kwCategory, seed_keywords: kwSeeds, market: kwMarket, language: kwLanguage }),
      });
      setKeywordResult(data.result);
    } catch (e: any) { setError(e.message || "Analysis failed"); }
    finally { setLoading(false); }
  }

  async function handleAnalyzeCompetitors() {
    if (!cpName) return;
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<{ result: ResearchResult }>("/api/market-research/analyze-competitors", {
        method: "POST",
        body: JSON.stringify({ product_name: cpName, product_features: cpFeatures, market: cpMarket, platform: cpPlatform, language: cpLanguage }),
      });
      setCompetitorResult(data.result);
    } catch (e: any) { setError(e.message || "Analysis failed"); }
    finally { setLoading(false); }
  }

  async function loadHistory(type: TabKey) {
    setHistoryTab(type);
    try {
      const data = await apiFetch<{ results: ResearchResult[] }>(`/api/market-research/results?analysis_type=${type}`);
      setHistory(data.results);
    } catch { /* ignore */ }
  }

  function handleFeatureKeyDown(e: React.KeyboardEvent<HTMLInputElement>, current: string, setter: (v: string) => void, list: string[], listSetter: (v: string[]) => void) {
    if (e.key === "Enter" && current.trim()) {
      e.preventDefault();
      listSetter([...list, current.trim()]);
      setter("");
    }
  }

  function removeFeature(idx: number, list: string[], listSetter: (v: string[]) => void) {
    listSetter(list.filter((_, i) => i !== idx));
  }

  /* ---- Render: Trending Tab ---- */

  function renderTrendingTab() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.trending.title")}</h2>
          <div className="space-y-4">
            <Input label={t("market_research.trending.category")} value={trCategory} onChange={(e) => setTrCategory(e.target.value)} placeholder="e.g. Electronics, Home & Kitchen" />
            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("market_research.trending.market"), trMarket, MARKETS, setTrMarket)}
              {renderSelect(t("market_research.trending.platform"), trPlatform, PLATFORMS, setTrPlatform)}
            </div>
            {renderSelect(t("market_research.trending.language"), trLanguage, LANGUAGES, setTrLanguage)}
            <Button onClick={handleAnalyzeTrending} loading={loading} className="w-full">
              {t("market_research.trending.analyze")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.trending.result")}</h2>
          {trendingResult ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-primary">{trendingResult.title}</h3>
                <p className="text-sm text-content/60">{trendingResult.summary}</p>
              </div>
              {trendingResult.structured_data?.products && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-edge">
                        <th className="text-left py-2 px-1 font-medium text-content/70">#</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.trending.product")}</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.trending.growth")}</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.trending.price")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trendingResult.structured_data.products.map((p: any, i: number) => (
                        <tr key={i} className="border-b border-edge/50">
                          <td className="py-2 px-1 font-bold text-content/50">{p.rank || i + 1}</td>
                          <td className="py-2 px-1">
                            <span className="font-medium">{p.name}</span>
                            <p className="text-xs text-content/50">{p.insight}</p>
                          </td>
                          <td className="py-2 px-1 text-green-600 font-medium">+{p.growth_pct}%</td>
                          <td className="py-2 px-1 text-content/70">{p.price_range}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <MarkdownBody body={trendingResult.body} />
            </div>
          ) : (
            <p className="text-content/50 text-sm">{t("market_research.trending.placeholder")}</p>
          )}
        </Card>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{t("market_research.history")}</h3>
            <Button variant="secondary" size="sm" onClick={() => loadHistory("trending")}>{t("market_research.actions.refresh")}</Button>
          </div>
          <div className="space-y-2">
            {history.filter(h => h.analysis_type === "trending").slice(0, 5).map((h) => (
              <Card key={h.id} className="p-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{h.title}</span>
                  <span className="ml-2 text-xs text-content/50">{new Date(h.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---- Render: Keywords Tab ---- */

  function renderKeywordsTab() {
    const allKeywords = keywordResult?.structured_data?.keywords || [];
    const keywordList = allKeywords.map((k: any) => k.keyword).join(",");

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.keywords.title")}</h2>
          <div className="space-y-4">
            <Input label={t("market_research.keywords.category")} value={kwCategory} onChange={(e) => setKwCategory(e.target.value)} />
            <div>
              <Input
                label={t("market_research.keywords.seeds")}
                value={kwSeedInput}
                onChange={(e) => setKwSeedInput(e.target.value)}
                onKeyDown={(e) => handleFeatureKeyDown(e, kwSeedInput, setKwSeedInput, kwSeeds, setKwSeeds)}
                placeholder={t("market_research.keywords.seeds_hint")}
              />
              {renderFeatureTags(kwSeeds, (i) => removeFeature(i, kwSeeds, setKwSeeds))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("market_research.keywords.market"), kwMarket, MARKETS, setKwMarket)}
              {renderSelect(t("market_research.keywords.language"), kwLanguage, LANGUAGES, setKwLanguage)}
            </div>
            <Button onClick={handleAnalyzeKeywords} loading={loading} className="w-full">
              {t("market_research.keywords.analyze")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.keywords.result")}</h2>
          {keywordResult ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-primary">{keywordResult.title}</h3>
                <p className="text-sm text-content/60">{keywordResult.summary}</p>
              </div>
              {allKeywords.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-edge">
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.keywords.keyword")}</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.keywords.volume")}</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.keywords.competition")}</th>
                        <th className="text-left py-2 px-1 font-medium text-content/70">{t("market_research.keywords.relevance")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allKeywords.map((kw: any, i: number) => (
                        <tr key={i} className="border-b border-edge/50">
                          <td className="py-2 px-1 font-medium">{kw.keyword}</td>
                          <td className="py-2 px-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${kw.search_volume === "high" ? "bg-green-100 text-green-800" : kw.search_volume === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}`}>{kw.search_volume}</span>
                          </td>
                          <td className="py-2 px-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${kw.competition === "low" ? "bg-green-100 text-green-800" : kw.competition === "high" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{kw.competition}</span>
                          </td>
                          <td className="py-2 px-1">{(kw.relevance * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {keywordList && (
                <Button variant="secondary" size="sm" onClick={() => window.location.href = `/copy-factory?keywords=${encodeURIComponent(keywordList)}`}>
                  {t("market_research.keywords.use_in_copy_factory")}
                </Button>
              )}
              <MarkdownBody body={keywordResult.body} />
            </div>
          ) : (
            <p className="text-content/50 text-sm">{t("market_research.keywords.placeholder")}</p>
          )}
        </Card>
      </div>
    );
  }

  /* ---- Render: Competitors Tab ---- */

  function renderCompetitorsTab() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.competitors.title")}</h2>
          <div className="space-y-4">
            <Input label={t("market_research.competitors.product_name")} value={cpName} onChange={(e) => setCpName(e.target.value)} />
            <div>
              <Input
                label={t("market_research.competitors.features")}
                value={cpFeatureInput}
                onChange={(e) => setCpFeatureInput(e.target.value)}
                onKeyDown={(e) => handleFeatureKeyDown(e, cpFeatureInput, setCpFeatureInput, cpFeatures, setCpFeatures)}
                placeholder={t("market_research.competitors.features_hint")}
              />
              {renderFeatureTags(cpFeatures, (i) => removeFeature(i, cpFeatures, setCpFeatures))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderSelect(t("market_research.competitors.market"), cpMarket, MARKETS, setCpMarket)}
              {renderSelect(t("market_research.competitors.platform"), cpPlatform, PLATFORMS, setCpPlatform)}
            </div>
            {renderSelect(t("market_research.competitors.language"), cpLanguage, LANGUAGES, setCpLanguage)}
            <Button onClick={handleAnalyzeCompetitors} loading={loading} className="w-full">
              {t("market_research.competitors.analyze")}
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">{t("market_research.competitors.result")}</h2>
          {competitorResult ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-primary">{competitorResult.title}</h3>
                <p className="text-sm text-content/60">{competitorResult.summary}</p>
              </div>
              {competitorResult.structured_data?.competitors && (
                <div className="space-y-3">
                  {competitorResult.structured_data.competitors.map((c: any, i: number) => (
                    <Card key={i} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-sm text-content/60">{c.price} &middot; ★{c.rating}</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <p><span className="text-green-600 font-medium">Strengths:</span> {c.strengths?.join(", ")}</p>
                        <p><span className="text-red-600 font-medium">Weaknesses:</span> {c.weaknesses?.join(", ")}</p>
                        <p className="text-content/50">{c.strategy}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              {competitorResult.structured_data?.differentiation_opportunities && (
                <div>
                  <span className="text-sm font-medium text-content/70">{t("market_research.competitors.opportunities")}</span>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {competitorResult.structured_data.differentiation_opportunities.map((o: string, i: number) => (
                      <li key={i} className="text-green-700">{o}</li>
                    ))}
                  </ul>
                </div>
              )}
              {competitorResult.structured_data?.pricing_advice && (
                <div>
                  <span className="text-sm font-medium text-content/70">{t("market_research.competitors.pricing")}</span>
                  <p className="text-sm mt-1">{competitorResult.structured_data.pricing_advice}</p>
                </div>
              )}
              <MarkdownBody body={competitorResult.body} />
            </div>
          ) : (
            <p className="text-content/50 text-sm">{t("market_research.competitors.placeholder")}</p>
          )}
        </Card>
      </div>
    );
  }

  /* ---- Render: Main ---- */

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{t("market_research.title")}</h1>
        <p className="text-sm text-content/50 mt-1">{t("market_research.subtitle")}</p>
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

      {activeTab === "trending" && renderTrendingTab()}
      {activeTab === "keywords" && renderKeywordsTab()}
      {activeTab === "competitors" && renderCompetitorsTab()}
    </div>
  );
}
