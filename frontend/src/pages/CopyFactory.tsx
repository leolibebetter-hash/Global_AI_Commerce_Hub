import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Tab = "title" | "bullets" | "description" | "keywords";
type OptimizeSection = Exclude<Tab, "keywords">;

interface TitleResponse {
  title: string;
  char_count: number;
  keywords_included: string[];
}

interface BulletResponse {
  bullets: string[];
}

interface DescriptionResponse {
  description: string;
  word_count: number;
}

interface KeywordItem {
  keyword: string;
  search_volume: number;
  competition: string;
  implanted: boolean;
}

interface KeywordListResponse {
  keywords: KeywordItem[];
}

interface GenerateAllResponse {
  title: TitleResponse;
  bullets: BulletResponse;
  description: DescriptionResponse;
  keywords: KeywordListResponse;
}

interface OptimizeResponse {
  optimized: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MARKETS = ["US", "UK", "DE", "JP", "FR", "CA", "AU"];
const LANGUAGES = ["en", "zh", "de", "ja", "fr"];

const MARKET_DEFAULT_LANG: Record<string, string> = {
  US: "en", UK: "en", CA: "en", AU: "en",
  DE: "de", JP: "ja", FR: "fr",
};

const MARKET_LABELS: Record<string, string> = {
  US: "🇺🇸 United States",
  UK: "🇬🇧 United Kingdom",
  DE: "🇩🇪 Germany",
  JP: "🇯🇵 Japan",
  FR: "🇫🇷 France",
  CA: "🇨🇦 Canada",
  AU: "🇦🇺 Australia",
};

const LANG_LABELS: Record<string, string> = {
  en: "English", zh: "中文", de: "Deutsch", ja: "日本語", fr: "Français",
};

const COMPETITION_STYLES: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const TAB_KEYS: { key: Tab; labelKey: string }[] = [
  { key: "title", labelKey: "copy_factory.tabs.title_tab" },
  { key: "bullets", labelKey: "copy_factory.tabs.bullets_tab" },
  { key: "description", labelKey: "copy_factory.tabs.description_tab" },
  { key: "keywords", labelKey: "copy_factory.tabs.keywords_tab" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CopyFactory() {
  const { t } = useTranslation();

  /* ---- Form state -------------------------------------------------- */

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [targetMarket, setTargetMarket] = useState("US");
  const [language, setLanguage] = useState("en");

  /* ---- Results state ----------------------------------------------- */

  const [activeTab, setActiveTab] = useState<Tab>("title");
  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState<TitleResponse | null>(null);
  const [bullets, setBullets] = useState<BulletResponse | null>(null);
  const [description, setDescription] = useState<DescriptionResponse | null>(null);
  const [keywords, setKeywords] = useState<KeywordListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---- Editable content -------------------------------------------- */

  const [editableTitle, setEditableTitle] = useState("");
  const [editableBullets, setEditableBullets] = useState<string[]>([]);
  const [showHtmlSource, setShowHtmlSource] = useState(false);

  /* ---- Optimize modal ---------------------------------------------- */

  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [optimizeTargetKeyword, setOptimizeTargetKeyword] = useState("");
  const [optimizeSection, setOptimizeSection] = useState<OptimizeSection>("title");
  const [optimizedContent, setOptimizedContent] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  /* ---- Misc UI state ----------------------------------------------- */

  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /* ---- Derived ----------------------------------------------------- */

  const hasResults = !!(title || bullets || description || keywords);

  const currentRegenerating = generating && hasResults;

  /* ---- Helpers ----------------------------------------------------- */

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, []);

  const buildProductPayload = useCallback(
    (lang?: string) => ({
      product_name: productName,
      category,
      features,
      target_market: targetMarket,
      language: lang ?? language,
    }),
    [productName, category, features, targetMarket, language],
  );

  /* ---- Generate All -------- --------------------------------------- */

  const handleGenerateAll = useCallback(
    async (lang?: string) => {
      setGenerating(true);
      setError(null);
      setConfirmed(false);

      const targetLang = lang ?? language;

      try {
        const res = await fetch("/api/copy-factory/generate-all", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            product: {
              ...buildProductPayload(targetLang),
              keywords: [],
              provider: "deepseek",
            },
            sections: ["title", "bullets", "description", "keywords"],
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Generation failed (${res.status})`);
        }

        const data: GenerateAllResponse = await res.json();

        setTitle(data.title);
        setBullets(data.bullets);
        setDescription(data.description);
        setKeywords(data.keywords);
        setEditableTitle(data.title.title);
        setEditableBullets(data.bullets.bullets);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
      } finally {
        setGenerating(false);
      }
    },
    [language, buildProductPayload, getAuthHeaders],
  );

  /* ---- Regenerate single section ----------------------------------- */

  const handleRegenerateSection = useCallback(
    async (section: Tab) => {
      setGenerating(true);
      setError(null);

      const endpointMap: Record<Tab, string> = {
        title: "/api/copy-factory/generate-title",
        bullets: "/api/copy-factory/generate-bullets",
        description: "/api/copy-factory/generate-description",
        keywords: "/api/copy-factory/keywords",
      };

      try {
        const res = await fetch(endpointMap[section], {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(buildProductPayload()),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Regeneration failed (${res.status})`);
        }

        if (section === "title") {
          const data: TitleResponse = await res.json();
          setTitle(data);
          setEditableTitle(data.title);
        } else if (section === "bullets") {
          const data: BulletResponse = await res.json();
          setBullets(data);
          setEditableBullets(data.bullets);
        } else if (section === "description") {
          const data: DescriptionResponse = await res.json();
          setDescription(data);
        } else if (section === "keywords") {
          const data: KeywordListResponse = await res.json();
          setKeywords(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Regeneration failed");
      } finally {
        setGenerating(false);
      }
    },
    [buildProductPayload, getAuthHeaders],
  );

  /* ---- Language toggle (action bar) -------------------------------- */

  const handleLanguageToggle = useCallback(() => {
    const newLang = language === "en" ? "zh" : "en";
    setLanguage(newLang);
    if (hasResults) {
      handleGenerateAll(newLang);
    }
  }, [language, hasResults, handleGenerateAll]);

  /* ---- Feature tags ------------------------------------------------ */

  const handleFeatureKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && featureInput.trim()) {
        e.preventDefault();
        setFeatures((prev) => [...prev, featureInput.trim()]);
        setFeatureInput("");
      }
    },
    [featureInput],
  );

  const removeFeature = useCallback((index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ---- Scores ------------------------------------------------------ */

  const scores = useMemo(() => {
    if (!title && !bullets && !description) return null;

    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

    const totalChars =
      (title?.title?.length ?? 0) +
      (bullets?.bullets?.join("").length ?? 0) +
      (description ? stripHtml(description.description).length : 0);

    const totalWords =
      (title?.title?.split(/\s+/).filter(Boolean).length ?? 0) +
      (bullets?.bullets
        ?.flatMap((b) => b.split(/\s+/).filter(Boolean))
        .length ?? 0) +
      (description
        ? stripHtml(description.description).split(/\s+/).filter(Boolean).length
        : 0);

    const kwList = keywords?.keywords ?? [];
    const totalKw = kwList.length;

    const calcDensity = (text: string) =>
      totalKw > 0
        ? (kwList.filter((k) =>
            text.toLowerCase().includes(k.keyword.toLowerCase()),
          ).length /
            totalKw) *
          100
        : 0;

    const titleDensity = title ? calcDensity(title.title) : 0;
    const bulletsDensity = bullets
      ? calcDensity(bullets.bullets.join(" "))
      : 0;
    const descDensity = description
      ? calcDensity(stripHtml(description.description))
      : 0;

    return {
      totalChars,
      totalWords,
      readability: totalWords > 0 ? totalChars / totalWords : 0,
      titleDensity,
      bulletsDensity,
      descDensity,
    };
  }, [title, bullets, description, keywords]);

  /* ---- Keyword density per bullet (bullets tab) -------------------- */

  const bulletKeywordDensities = useMemo(() => {
    if (!bullets || !keywords) return [];
    const kwList = keywords.keywords;
    return bullets.bullets.map((bullet) => {
      const words = bullet.split(/\s+/).filter(Boolean);
      const matched = kwList.filter((k) =>
        bullet.toLowerCase().includes(k.keyword.toLowerCase()),
      ).length;
      return {
        original: bullet,
        density: words.length > 0 ? (matched / words.length) * 100 : 0,
        matched,
      };
    });
  }, [bullets, keywords]);

  /* ---- Search volume bar helpers ----------------------------------- */

  const maxSearchVolume = useMemo(() => {
    if (!keywords || keywords.keywords.length === 0) return 1;
    return Math.max(...keywords.keywords.map((k) => k.search_volume), 1);
  }, [keywords]);

  const volumeColor = (value: number) => {
    const ratio = value / maxSearchVolume;
    if (ratio > 0.66) return "bg-green-500";
    if (ratio > 0.33) return "bg-yellow-500";
    return "bg-red-500";
  };

  /* ---- Optimize handlers ------------------------------------------- */

  const openOptimizeModal = useCallback(() => {
    setOptimizeTargetKeyword("");
    setOptimizedContent(null);
    setOptimizeSection("title");
    setShowOptimizeModal(true);
  }, []);

  const handleOptimize = useCallback(async () => {
    if (!optimizeTargetKeyword.trim()) return;
    setOptimizing(true);
    setError(null);

    let content = "";
    if (optimizeSection === "title") content = editableTitle;
    else if (optimizeSection === "bullets") content = editableBullets.join("\n");
    else if (optimizeSection === "description") content = description?.description ?? "";

    try {
      const res = await fetch("/api/copy-factory/optimize", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content,
          target_keyword: optimizeTargetKeyword,
          section: optimizeSection,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Optimization failed (${res.status})`);
      }

      const data: OptimizeResponse = await res.json();
      setOptimizedContent(data.optimized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimization failed");
    } finally {
      setOptimizing(false);
    }
  }, [
    optimizeTargetKeyword,
    optimizeSection,
    editableTitle,
    editableBullets,
    description,
    getAuthHeaders,
  ]);

  const handleApplyOptimization = useCallback(() => {
    if (optimizedContent === null) return;

    if (optimizeSection === "title") {
      setEditableTitle(optimizedContent);
      if (title) {
        setTitle({
          ...title,
          title: optimizedContent,
          char_count: optimizedContent.length,
        });
      }
    } else if (optimizeSection === "bullets") {
      const newBullets = optimizedContent
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      setEditableBullets(newBullets);
      if (bullets) setBullets({ bullets: newBullets });
    } else if (optimizeSection === "description") {
      if (description) setDescription({ ...description, description: optimizedContent });
    }

    setShowOptimizeModal(false);
    setOptimizedContent(null);
    setOptimizeTargetKeyword("");
  }, [optimizedContent, optimizeSection, title, bullets, description]);

  /* ---- Confirm ----------------------------------------------------- */

  const handleConfirm = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/copy-factory/confirm", {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Confirm failed (${res.status})`);
      }

      setConfirmed(true);
      setToast(t("copy_factory.editing.confirm_success"));
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    }
  }, [getAuthHeaders, t]);

  /* ---- Copy keywords ----------------------------------------------- */

  const handleCopyKeywords = useCallback(async () => {
    if (!keywords) return;
    const text = keywords.keywords.map((k) => k.keyword).join(", ");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }, [keywords]);

  /* ---- Skeleton loader --------------------------------------------- */

  const skeleton = (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-7 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );

  /* ================================================================== */
  /*  RENDER                                                            */
  /* ================================================================== */

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm max-w-sm animate-fade-in">
          {toast}
        </div>
      )}

      <h2 className="text-2xl font-bold">{t("nav.copy_factory")}</h2>

      {/* Error banner */}
      {error && (
        <Card className="border-red-300 bg-red-50">
          <div className="flex items-center justify-between">
            <p className="text-red-700 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Main grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ============================================================ */}
        {/*  LEFT SIDEBAR                                                */}
        {/* ============================================================ */}
        <div className="w-full lg:w-80 space-y-6 shrink-0">
          {/* Product info form */}
          <Card>
            <h3 className="font-semibold text-lg mb-4">
              {t("copy_factory.title")}
            </h3>
            <div className="space-y-4">
              <Input
                label={t("copy_factory.product_name")}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Wireless Bluetooth Earbuds"
              />

              <Input
                label={t("copy_factory.category")}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Electronics"
              />

              {/* Features tags */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-content">
                  {t("copy_factory.features")}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {features.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="ml-0.5 hover:text-red-600 transition-colors"
                        aria-label={`Remove ${f}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={handleFeatureKeyDown}
                  placeholder={t("copy_factory.features_hint")}
                  className="w-full rounded-lg border border-edge bg-white px-4 py-2 text-sm text-content placeholder:text-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Target market */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-content">
                  {t("copy_factory.target_market")}
                </label>
                <select
                  value={targetMarket}
                  onChange={(e) => {
                    const m = e.target.value;
                    setTargetMarket(m);
                    setLanguage(MARKET_DEFAULT_LANG[m] || "en");
                  }}
                  className="w-full rounded-lg border border-edge bg-white px-4 py-2 text-sm text-content transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {MARKETS.map((m) => (
                    <option key={m} value={m}>
                      {MARKET_LABELS[m] || m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-content">
                  {t("copy_factory.language")}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-edge bg-white px-4 py-2 text-sm text-content transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {LANG_LABELS[l] || l}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="primary"
                size="lg"
                loading={generating && !currentRegenerating}
                disabled={!productName || (generating && !currentRegenerating)}
                onClick={() => handleGenerateAll()}
                className="w-full"
              >
                {generating && !currentRegenerating
                  ? t("copy_factory.generating")
                  : t("copy_factory.generate_all")}
              </Button>
            </div>
          </Card>

          {/* Content Score Card */}
          {hasResults && scores && (
            <Card>
              <h3 className="font-semibold mb-4">
                {t("copy_factory.scores.content_score")}
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">
                      {t("copy_factory.tabs.title_tab")}{" "}
                      {t("copy_factory.scores.keyword_density")}
                    </span>
                    <span className="font-medium">
                      {scores.titleDensity.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(scores.titleDensity, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">
                      {t("copy_factory.tabs.bullets_tab")}{" "}
                      {t("copy_factory.scores.keyword_density")}
                    </span>
                    <span className="font-medium">
                      {scores.bulletsDensity.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min(scores.bulletsDensity, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">
                      {t("copy_factory.tabs.description_tab")}{" "}
                      {t("copy_factory.scores.keyword_density")}
                    </span>
                    <span className="font-medium">
                      {scores.descDensity.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min(scores.descDensity, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <hr className="border-edge" />
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    {t("copy_factory.scores.char_count")}
                  </span>
                  <span className="font-medium">
                    {scores.totalChars.toLocaleString()}{" "}
                    {t("copy_factory.status.chars")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    {t("copy_factory.scores.readability")}
                  </span>
                  <span className="font-medium">
                    {scores.readability.toFixed(1)}{" "}
                    {t("copy_factory.status.words")}/{t("copy_factory.status.chars")}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* ============================================================ */}
        {/*  MAIN CONTENT                                                */}
        {/* ============================================================ */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Empty state */}
          {!hasResults && !generating && (
            <Card>
              <p className="text-gray-400 text-center py-8">
                {t("copy_factory.editing.fill_form")}
              </p>
            </Card>
          )}

          {/* Initial loading skeleton */}
          {generating && !hasResults && (
            <Card>{skeleton}</Card>
          )}

          {/* Results */}
          {hasResults && (
            <>
              {/* Tab bar */}
              <div className="flex border-b border-edge">
                {TAB_KEYS.map(({ key, labelKey }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors duration-200 border-b-2 -mb-px ${
                      activeTab === key
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-content hover:border-gray-300"
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <Card>
                {/* Loading skeleton on regenerate */}
                {generating && currentRegenerating ? (
                  skeleton
                ) : (
                  <>
                    {/* ---- Title tab ------------------------------------ */}
                    {activeTab === "title" && title && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <h4 className="font-semibold">
                            {t("copy_factory.tabs.title_tab")}
                          </h4>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                editableTitle.length <= 200
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {editableTitle.length}{" "}
                              {t("copy_factory.status.chars")}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={generating}
                              onClick={() => handleRegenerateSection("title")}
                            >
                              {t("copy_factory.actions.regenerate")}
                            </Button>
                          </div>
                        </div>

                        <textarea
                          value={editableTitle}
                          onChange={(e) => setEditableTitle(e.target.value)}
                          className="w-full rounded-lg border border-edge bg-white px-4 py-3 text-lg font-semibold text-content resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={2}
                        />

                        {/* Keywords included */}
                        {title.keywords_included.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1.5">
                              {t("copy_factory.status.keywords_found")}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {title.keywords_included.map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ---- Bullets tab --------------------------------- */}
                    {activeTab === "bullets" && bullets && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">
                            {t("copy_factory.tabs.bullets_tab")}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={generating}
                            onClick={() => handleRegenerateSection("bullets")}
                          >
                            {t("copy_factory.actions.regenerate")}
                          </Button>
                        </div>

                        <ol className="space-y-3 list-decimal list-inside">
                          {editableBullets.map((bullet, i) => (
                            <li key={i} className="text-sm">
                              <textarea
                                value={bullet}
                                onChange={(e) => {
                                  const next = [...editableBullets];
                                  next[i] = e.target.value;
                                  setEditableBullets(next);
                                }}
                                className="w-full mt-1 rounded-lg border border-edge bg-white px-3 py-2 text-sm text-content resize-y min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows={2}
                              />
                              {keywords && bulletKeywordDensities[i] && (
                                <div className="flex items-center gap-2 mt-1 ml-6">
                                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                                    <div
                                      className={`h-full rounded-full ${
                                        bulletKeywordDensities[i].density > 10
                                          ? "bg-green-500"
                                          : bulletKeywordDensities[i].density > 3
                                            ? "bg-yellow-500"
                                            : "bg-gray-300"
                                      }`}
                                      style={{
                                        width: `${Math.min(bulletKeywordDensities[i].density, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {bulletKeywordDensities[i].matched}{" "}
                                    {t("copy_factory.status.keywords_found")}
                                  </span>
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* ---- Description tab ----------------------------- */}
                    {activeTab === "description" && description && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <h4 className="font-semibold">
                            {t("copy_factory.tabs.description_tab")}
                          </h4>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {description.word_count}{" "}
                              {t("copy_factory.status.words")}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowHtmlSource(!showHtmlSource)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              {showHtmlSource
                                ? t("copy_factory.editing.description_view")
                                : t("copy_factory.editing.description_source")}
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={generating}
                              onClick={() => handleRegenerateSection("description")}
                            >
                              {t("copy_factory.actions.regenerate")}
                            </Button>
                          </div>
                        </div>

                        {showHtmlSource ? (
                          <pre className="w-full rounded-lg border border-edge bg-gray-50 p-4 text-xs text-content overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                            {description.description}
                          </pre>
                        ) : (
                          <div
                            className="prose prose-sm max-w-none p-4 rounded-lg border border-edge bg-white"
                            dangerouslySetInnerHTML={{
                              __html: description.description,
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* ---- Keywords tab -------------------------------- */}
                    {activeTab === "keywords" && keywords && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <h4 className="font-semibold">
                            {t("copy_factory.tabs.keywords_tab")}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyKeywords}
                            >
                              {t("copy_factory.actions.copy_all")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={generating}
                              onClick={() => handleRegenerateSection("keywords")}
                            >
                              {t("copy_factory.actions.regenerate")}
                            </Button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-edge text-left">
                                <th className="pb-2 pr-4 font-medium text-gray-500">
                                  {t("copy_factory.tabs.keywords_tab")}
                                </th>
                                <th className="pb-2 pr-4 font-medium text-gray-500">
                                  Search Volume
                                </th>
                                <th className="pb-2 pr-4 font-medium text-gray-500">
                                  Competition
                                </th>
                                <th className="pb-2 font-medium text-gray-500">
                                  Implanted
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {keywords.keywords.map((kw, i) => (
                                <tr
                                  key={i}
                                  className={`border-b border-edge ${
                                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                  }`}
                                >
                                  <td className="py-2.5 pr-4 font-medium text-content">
                                    {kw.keyword}
                                  </td>
                                  <td className="py-2.5 pr-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${volumeColor(kw.search_volume)}`}
                                          style={{
                                            width: `${(kw.search_volume / maxSearchVolume) * 100}%`,
                                          }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {kw.search_volume.toLocaleString()}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 pr-4">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                        COMPETITION_STYLES[
                                          kw.competition
                                        ] ?? "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {kw.competition === "low"
                                        ? t("copy_factory.editing.competition_low")
                                        : kw.competition === "medium"
                                          ? t(
                                              "copy_factory.editing.competition_medium",
                                            )
                                          : t(
                                              "copy_factory.editing.competition_high",
                                            )}
                                    </span>
                                  </td>
                                  <td className="py-2.5">
                                    {kw.implanted ? (
                                      <span className="text-green-600 font-bold text-base">
                                        &#10003;
                                      </span>
                                    ) : (
                                      <span className="text-gray-300 text-base">
                                        &#10007;
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <p className="text-xs text-gray-400">
                          {keywords.keywords.length}{" "}
                          {t("copy_factory.status.keywords_found")}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/*  ACTION BAR (sticky bottom)                                    */}
      {/* ============================================================== */}
      {hasResults && (
        <div className="sticky bottom-0 bg-white border border-edge rounded-lg shadow-lg p-4 z-30">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left: language toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {t("copy_factory.language")}:
              </span>
              <button
                type="button"
                onClick={handleLanguageToggle}
                disabled={generating}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-edge hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                {language === "en" ? "中文" : "English"}
              </button>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={openOptimizeModal}
                disabled={generating}
              >
                {t("copy_factory.actions.optimize")}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirm}
                disabled={confirmed || generating}
              >
                {confirmed ? "✅ " : ""}
                {t("copy_factory.actions.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/*  OPTIMIZE MODAL                                                */}
      {/* ============================================================== */}
      {showOptimizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-edge w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {t("copy_factory.actions.optimize_title")}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowOptimizeModal(false)}
                  className="text-gray-400 hover:text-content transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Target keyword */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-content">
                  {t("copy_factory.editing.target_keyword")}
                </label>
                <input
                  value={optimizeTargetKeyword}
                  onChange={(e) => setOptimizeTargetKeyword(e.target.value)}
                  placeholder="e.g. wireless earbuds"
                  className="w-full rounded-lg border border-edge bg-white px-4 py-2 text-sm text-content placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Section select */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-content">
                  {t("copy_factory.editing.section")}
                </label>
                <select
                  value={optimizeSection}
                  onChange={(e) =>
                    setOptimizeSection(e.target.value as OptimizeSection)
                  }
                  className="w-full rounded-lg border border-edge bg-white px-4 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="title">
                    {t("copy_factory.tabs.title_tab")}
                  </option>
                  <option value="bullets">
                    {t("copy_factory.tabs.bullets_tab")}
                  </option>
                  <option value="description">
                    {t("copy_factory.tabs.description_tab")}
                  </option>
                </select>
              </div>

              {/* Optimize button */}
              <Button
                variant="primary"
                size="md"
                loading={optimizing}
                disabled={!optimizeTargetKeyword.trim() || optimizing}
                onClick={handleOptimize}
              >
                {t("copy_factory.editing.optimize_btn")}
              </Button>

              {/* Optimized result */}
              {optimizedContent !== null && (
                <div className="space-y-3">
                  <hr className="border-edge" />
                  <label className="block text-sm font-medium text-content">
                    {t("copy_factory.editing.optimize_btn")}
                  </label>
                  <div className="rounded-lg border border-edge bg-gray-50 p-4 text-sm text-content whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {optimizedContent}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowOptimizeModal(false);
                        setOptimizedContent(null);
                        setOptimizeTargetKeyword("");
                      }}
                    >
                      {t("copy_factory.editing.cancel")}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApplyOptimization}
                    >
                      {t("copy_factory.editing.apply")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
