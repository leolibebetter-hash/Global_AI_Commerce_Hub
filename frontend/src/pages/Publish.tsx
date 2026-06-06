import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabType = "new" | "history";

interface PlatformAccount {
  id: string;
  platform: string;
  seller_id: string;
  marketplace_id?: string;
  store_name: string;
  is_active: boolean;
  created_at: string;
}

interface PublishRecord {
  id: string;
  platform: string;
  listing_id?: string;
  asin?: string;
  status: string;
  title?: string;
  sku?: string;
  price?: number;
  error_message?: string;
  seller_central_url?: string;
  created_at: string;
}

interface PublishHistory {
  records: PublishRecord[];
  total: number;
  limit: number;
  offset: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PLATFORMS = [
  { key: "amazon", label: "Amazon", icon: "📦", color: "bg-orange-500" },
  { key: "ebay", label: "eBay", icon: "🛒", color: "bg-blue-500" },
  { key: "shopify", label: "Shopify", icon: "🏪", color: "bg-green-600" },
  { key: "tiktok", label: "TikTok Shop", icon: "🎵", color: "bg-black" },
];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const HISTORY_LIMIT = 20;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function Publish() {
  const { t } = useTranslation();
  const location = useLocation();

  const prefillImages =
    (location.state as { prefillImages?: string } | null)?.prefillImages || "";

  /* ---- Platform state ---------------------------------------------- */

  const [selectedPlatform, setSelectedPlatform] = useState("amazon");
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);

  /* ---- Connection state -------------------------------------------- */

  const [sellerIdInput, setSellerIdInput] = useState("");
  const [storeNameInput, setStoreNameInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [connectionLoading, setConnectionLoading] = useState(false);

  /* ---- Tab state --------------------------------------------------- */

  const [activeTab, setActiveTab] = useState<TabType>("new");

  /* ---- Form state -------------------------------------------------- */

  const [title, setTitle] = useState("");
  const [bullets, setBullets] = useState(["", "", "", "", ""]);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState(prefillImages);
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  /* ---- Publish state ----------------------------------------------- */

  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    type: "success" | "error";
    listing_id?: string;
    platform?: string;
    seller_central_url?: string;
    error?: string;
  } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ---- History state ----------------------------------------------- */

  const [records, setRecords] = useState<PublishRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPlatformFilter, setHistoryPlatformFilter] = useState<string | null>(null);

  /* ---- Derived state ----------------------------------------------- */

  const connectedAccount = accounts.find(
    (a) => a.platform === selectedPlatform && a.is_active
  );

  /* ---- Load data on mount & platform change ------------------------ */

  const loadAccounts = useCallback(async () => {
    try {
      const data = await fetch("/api/publish/accounts", { headers: getAuthHeaders() }).then(r => r.json());
      setAccounts(data.accounts || []);
    } catch { /* ignore */ }
  }, []);

  const loadHistory = useCallback(async (plat?: string | null, offs?: number) => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(HISTORY_LIMIT));
      params.set("offset", String(offs ?? historyOffset));
      if (plat) params.set("platform", plat);
      const data = await fetch(`/api/publish/history?${params}`, {
        headers: getAuthHeaders(),
      }).then(r => r.json());
      setRecords(data.records || []);
      setHistoryTotal(data.total || 0);
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); }
  }, [historyOffset]);

  useEffect(() => { loadAccounts(); loadHistory(); }, [loadAccounts, loadHistory]);
  useEffect(() => { loadHistory(historyPlatformFilter, 0); }, [historyPlatformFilter]);

  /* ---- Connect account --------------------------------------------- */

  async function handleConnect() {
    if (!sellerIdInput.trim() || !storeNameInput.trim() || !tokenInput.trim()) return;
    setConnectionLoading(true);
    try {
      await fetch("/api/publish/accounts/connect", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selectedPlatform,
          seller_id: sellerIdInput.trim(),
          access_token: tokenInput.trim(),
          store_name: storeNameInput.trim(),
        }),
      });
      setSellerIdInput("");
      setTokenInput("");
      setStoreNameInput("");
      await loadAccounts();
    } catch { /* ignore */ }
    finally { setConnectionLoading(false); }
  }

  async function handleDisconnect(accountId: string) {
    await fetch(`/api/publish/accounts/${accountId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    await loadAccounts();
  }

  /* ---- Publish ----------------------------------------------------- */

  function handleBulletChange(idx: number, value: string) {
    const next = [...bullets];
    next[idx] = value;
    setBullets(next);
  }

  async function doPublish() {
    if (!title.trim() || !description.trim() || !sku.trim() || !price || !category.trim()) {
      setFormError("Please fill in all required fields");
      return;
    }
    if (!connectedAccount) {
      setFormError(`Connect a ${selectedPlatform} account first`);
      return;
    }
    setPublishing(true);
    setFormError(null);
    try {
      const data = await fetch("/api/publish/create", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selectedPlatform,
          title: title.trim(),
          bullets: bullets.filter(b => b.trim()),
          description: description.trim(),
          images: images ? images.split(",").map(s => s.trim()).filter(Boolean) : [],
          sku: sku.trim(),
          price: parseFloat(price),
          quantity: parseInt(quantity) || 0,
          category: category.trim(),
        }),
      }).then(r => r.json());

      setPublishResult({
        type: data.status === "published" ? "success" : "error",
        listing_id: data.listing_id,
        platform: data.platform,
        seller_central_url: data.seller_central_url,
        error: data.error,
      });

      if (data.status === "published") {
        setTitle(""); setBullets(["", "", "", "", ""]); setDescription("");
        setImages(""); setSku(""); setPrice(""); setQuantity(""); setCategory("");
      }
      loadHistory(historyPlatformFilter, 0);
    } catch (e: any) {
      setPublishResult({ type: "error", error: e.message || "Publish failed" });
    } finally {
      setPublishing(false);
    }
  }

  /* ---- Render: Platform Selector ----------------------------------- */

  function renderPlatformSelector() {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {PLATFORMS.map((p) => {
          const acc = accounts.find(a => a.platform === p.key && a.is_active);
          return (
            <button
              key={p.key}
              onClick={() => { setSelectedPlatform(p.key); setPublishResult(null); }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedPlatform === p.key
                  ? "border-primary bg-primary-light/30 shadow-md"
                  : "border-edge hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{p.icon}</span>
                <span className="font-semibold text-sm">{p.label}</span>
              </div>
              <span className={`text-xs ${acc ? "text-green-600" : "text-content/40"}`}>
                {acc ? `✓ ${acc.store_name}` : "Not connected"}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ---- Render: Connection Panel ------------------------------------ */

  function renderConnectionPanel() {
    const acc = connectedAccount;
    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">
              {acc
                ? `${t("publish.connected")} — ${acc.store_name}`
                : `${t("publish.connect_button")} ${PLATFORMS.find(p => p.key === selectedPlatform)?.label}`}
            </h3>
            {acc && <p className="text-xs text-content/50 mt-1">{acc.seller_id}</p>}
          </div>
          {acc ? (
            <Button variant="secondary" size="sm" onClick={() => handleDisconnect(acc.id)}>
              {t("publish.disconnect")}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                className="rounded-lg border border-edge px-3 py-1.5 text-sm w-32"
                placeholder="Store name"
                value={storeNameInput}
                onChange={(e) => setStoreNameInput(e.target.value)}
              />
              <input
                className="rounded-lg border border-edge px-3 py-1.5 text-sm w-32"
                placeholder={t("publish.seller_id_label")}
                value={sellerIdInput}
                onChange={(e) => setSellerIdInput(e.target.value)}
              />
              <input
                className="rounded-lg border border-edge px-3 py-1.5 text-sm w-32"
                placeholder="Access Token"
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
              <Button variant="primary" size="sm" onClick={handleConnect} loading={connectionLoading}>
                {t("publish.connect_button")}
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  /* ---- Render: Listing Form ---------------------------------------- */

  function renderListingForm() {
    return (
      <div className="space-y-4">
        <Input label={t("publish.listing_form.listing_title")} value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-content/70 mb-1">{t("publish.listing_form.bullets")}</label>
          {bullets.map((b, i) => (
            <input key={i} value={b} onChange={(e) => handleBulletChange(i, e.target.value)}
              className="w-full mb-1 rounded-lg border border-edge px-3 py-1.5 text-sm"
              placeholder={`Bullet ${i + 1}`}
            />
          ))}
        </div>
        <Input label={t("publish.listing_form.description")} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label={t("publish.listing_form.images")} value={images} onChange={(e) => setImages(e.target.value)} placeholder="URL1, URL2, ..." />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("publish.listing_form.sku")} value={sku} onChange={(e) => setSku(e.target.value)} />
          <Input label={t("publish.listing_form.price")} value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("publish.listing_form.quantity")} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Input label={t("publish.listing_form.category")} value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        {formError && <p className="text-red-500 text-sm">{formError}</p>}

        {!showConfirm ? (
          <Button onClick={() => setShowConfirm(true)} className="w-full" disabled={!connectedAccount}>
            {t("publish.publish_button")}
          </Button>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium mb-3">{t("publish.confirm_dialog.message")}</p>
            <div className="flex gap-3">
              <Button onClick={() => { setShowConfirm(false); doPublish(); }} loading={publishing} variant="primary">
                {t("publish.confirm_dialog.title")}
              </Button>
              <Button onClick={() => setShowConfirm(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---- Render: Publish Result -------------------------------------- */

  function renderPublishResult() {
    if (!publishResult) return null;
    return (
      <Card className={`mt-4 p-4 ${publishResult.type === "success" ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
        {publishResult.type === "success" ? (
          <div>
            <p className="font-semibold text-green-700">{t("publish.publish_success")}</p>
            {publishResult.seller_central_url && (
              <a href={publishResult.seller_central_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-primary underline mt-1 inline-block">
                {t("publish.view_on_amazon")}
              </a>
            )}
          </div>
        ) : (
          <div>
            <p className="font-semibold text-red-700">{t("publish.publish_failed")}</p>
            {publishResult.error && <p className="text-sm mt-1">{publishResult.error}</p>}
          </div>
        )}
      </Card>
    );
  }

  /* ---- Render: History --------------------------------------------- */

  function renderHistory() {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{t("publish.history.history_title")}</h3>
          <div className="flex items-center gap-2">
            <select
              value={historyPlatformFilter || ""}
              onChange={(e) => { setHistoryPlatformFilter(e.target.value || null); setHistoryOffset(0); }}
              className="rounded-lg border border-edge px-3 py-1.5 text-sm"
            >
              <option value="">{t("publish.history.filter_all")}</option>
              {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <Button variant="secondary" size="sm" onClick={() => loadHistory(historyPlatformFilter, 0)}>
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          {records.length === 0 ? (
            <p className="text-content/50 text-sm py-8 text-center">{t("publish.empty_state.no_records")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge">
                    <th className="text-left py-2 px-2 font-medium text-content/70">Platform</th>
                    <th className="text-left py-2 px-2 font-medium text-content/70">Title</th>
                    <th className="text-left py-2 px-2 font-medium text-content/70">SKU</th>
                    <th className="text-left py-2 px-2 font-medium text-content/70">Price</th>
                    <th className="text-left py-2 px-2 font-medium text-content/70">Status</th>
                    <th className="text-left py-2 px-2 font-medium text-content/70">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-edge/50 hover:bg-primary-light/30">
                      <td className="py-2 px-2">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100">{r.platform}</span>
                      </td>
                      <td className="py-2 px-2 font-medium max-w-[200px] truncate">{r.title || "-"}</td>
                      <td className="py-2 px-2 text-content/70">{r.sku || "-"}</td>
                      <td className="py-2 px-2 text-content/70">{r.price ? `$${r.price}` : "-"}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[r.status] || ""}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-content/50 text-xs">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {historyTotal > HISTORY_LIMIT && (
            <div className="flex items-center justify-between p-3 border-t border-edge">
              <span className="text-xs text-content/50">
                {historyOffset + 1}–{Math.min(historyOffset + HISTORY_LIMIT, historyTotal)} of {historyTotal}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={historyOffset === 0}
                  onClick={() => setHistoryOffset(Math.max(0, historyOffset - HISTORY_LIMIT))}>
                  ← Prev
                </Button>
                <Button variant="secondary" size="sm" disabled={historyOffset + HISTORY_LIMIT >= historyTotal}
                  onClick={() => setHistoryOffset(historyOffset + HISTORY_LIMIT)}>
                  Next →
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  /* ---- Render: Main ------------------------------------------------ */

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-content">{t("publish.title")}</h2>
          <p className="text-sm text-content/60 mt-1">Multi-platform one-click publishing</p>
        </div>
      </div>

      {/* Platform selector */}
      {renderPlatformSelector()}

      {/* Account connection */}
      {renderConnectionPanel()}

      {/* Tabs */}
      <div className="flex border-b border-edge">
        <button onClick={() => setActiveTab("new")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "new" ? "border-primary text-primary" : "border-transparent text-content/50 hover:text-content"
          }`}>
          New Listing
        </button>
        <button onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "history" ? "border-primary text-primary" : "border-transparent text-content/50 hover:text-content"
          }`}>
          {t("publish.history.history_title")}
        </button>
      </div>

      {activeTab === "new" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-semibold mb-4 text-lg">Listing Details</h3>
            {renderListingForm()}
          </Card>
          <div>
            {renderPublishResult()}
          </div>
        </div>
      )}

      {activeTab === "history" && renderHistory()}
    </div>
  );
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}
