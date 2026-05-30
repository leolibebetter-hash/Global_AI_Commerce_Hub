import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabType = "new" | "history";

interface ConnectionStatus {
  connected: boolean;
  seller_id?: string;
  marketplace_id?: string;
  connected_at?: string;
}

interface ListingForm {
  title: string;
  bullets: string[];
  description: string;
  images: string;
  sku: string;
  price: string;
  quantity: string;
  category: string;
}

type PublishStatus = "draft" | "published" | "failed";

interface PublishRecord {
  id: string;
  title: string;
  sku: string;
  asin?: string;
  status: PublishStatus;
  price: number;
  created_at: string;
  error_message?: string;
  seller_central_url?: string;
}

interface HistoryResponse {
  records: PublishRecord[];
  total: number;
  limit: number;
  offset: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<PublishStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const HISTORY_LIMIT = 20;

const EMPTY_FORM: ListingForm = {
  title: "",
  bullets: ["", "", "", "", ""],
  description: "",
  images: "",
  sku: "",
  price: "",
  quantity: "",
  category: "",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function Publish() {
  const { t } = useTranslation();

  /* ---- Connection state ------------------------------------------- */

  const [connection, setConnection] = useState<ConnectionStatus>({
    connected: false,
  });
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [sellerIdInput, setSellerIdInput] = useState("");

  /* ---- Tab state -------------------------------------------------- */

  const [activeTab, setActiveTab] = useState<TabType>("new");

  /* ---- Form state ------------------------------------------------- */

  const [form, setForm] = useState<ListingForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  /* ---- Publish state ---------------------------------------------- */

  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    type: "success" | "error";
    asin?: string;
    seller_central_url?: string;
    error?: string;
    record_id?: string;
  } | null>(null);

  /* ---- Confirm dialog --------------------------------------------- */

  const [showConfirm, setShowConfirm] = useState(false);

  /* ---- History state ---------------------------------------------- */

  const [records, setRecords] = useState<PublishRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyFilter, setHistoryFilter] = useState<PublishStatus | "all">(
    "all"
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ---- Fetch connection status on mount --------------------------- */

  const fetchConnectionStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/amazon/status", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data: ConnectionStatus = await res.json();
        setConnection(data);
      } else {
        setConnection({ connected: false });
      }
    } catch {
      setConnection({ connected: false });
    }
  }, []);

  useEffect(() => {
    fetchConnectionStatus();
  }, [fetchConnectionStatus]);

  /* ---- Connect / Disconnect handlers ------------------------------ */

  const handleConnect = async () => {
    if (!sellerIdInput.trim()) return;
    setConnectionLoading(true);
    try {
      const res = await fetch("/api/amazon/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ seller_id: sellerIdInput.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setConnection({
          connected: true,
          seller_id: data.seller_id,
        });
        setSellerIdInput("");
      } else {
        alert("Failed to connect Amazon account.");
      }
    } catch {
      alert("Network error while connecting.");
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setConnectionLoading(true);
    try {
      await fetch("/api/amazon/disconnect", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      setConnection({ connected: false });
      setPublishResult(null);
    } catch {
      alert("Network error while disconnecting.");
    } finally {
      setConnectionLoading(false);
    }
  };

  /* ---- Form helpers ----------------------------------------------- */

  const handleBulletChange = (index: number, value: string) => {
    const next = [...form.bullets];
    next[index] = value;
    setForm({ ...form, bullets: next });
  };

  /* ---- Publish ---------------------------------------------------- */

  const handlePublish = async () => {
    setShowConfirm(false);
    setPublishing(true);
    setPublishResult(null);
    setFormError(null);

    try {
      const body = new URLSearchParams();
      body.set("title", form.title);
      body.set("bullets", JSON.stringify(form.bullets.filter((b) => b.trim())));
      body.set("description", form.description);
      body.set(
        "images",
        JSON.stringify(
          form.images
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );
      body.set("sku", form.sku);
      body.set("price", form.price);
      body.set("quantity", form.quantity);
      body.set("category", form.category);

      const headers: Record<string, string> = {
        ...getAuthHeaders(),
      };

      const res = await fetch("/api/publish/create", {
        method: "POST",
        headers,
        body,
      });

      if (res.ok) {
        const data = await res.json();
        setPublishResult({
          type: "success",
          asin: data.asin,
          seller_central_url: data.seller_central_url,
          record_id: data.record_id,
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        setPublishResult({
          type: "error",
          error: errData.detail || errData.error || `HTTP ${res.status}`,
        });
      }
    } catch (err) {
      setPublishResult({
        type: "error",
        error: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setPublishing(false);
    }
  };

  /* ---- Fetch history ---------------------------------------------- */

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(HISTORY_LIMIT),
        offset: String(historyOffset),
      });
      if (historyFilter !== "all") {
        params.set("status", historyFilter);
      }

      const res = await fetch(`/api/publish/history?${params}`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data: HistoryResponse = await res.json();
        setRecords(data.records);
        setHistoryTotal(data.total);
      } else {
        setRecords([]);
        setHistoryTotal(0);
      }
    } catch {
      setRecords([]);
      setHistoryTotal(0);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyOffset, historyFilter]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  /* ---- Pagination ------------------------------------------------- */

  const totalPages = Math.ceil(historyTotal / HISTORY_LIMIT);
  const currentPage = Math.floor(historyOffset / HISTORY_LIMIT) + 1;

  const goToPage = (page: number) => {
    setHistoryOffset((page - 1) * HISTORY_LIMIT);
    setExpandedId(null);
  };

  /* ---- Filter change ---------------------------------------------- */

  const handleFilterChange = (filter: PublishStatus | "all") => {
    setHistoryFilter(filter);
    setHistoryOffset(0);
    setExpandedId(null);
  };

  /* ---- Render helpers --------------------------------------------- */

  const renderConnectionBanner = () => {
    if (connection.connected) {
      return (
        <Card className="border-green-300 bg-green-50 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-200 text-green-800">
                <span className="w-2 h-2 rounded-full bg-green-600" />
                {t("publish.connected")}
              </span>
              <span className="text-sm text-content">
                {connection.seller_id}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={connectionLoading}
              onClick={handleDisconnect}
            >
              {t("publish.disconnect")}
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <Card className="border-yellow-300 bg-yellow-50 mb-6">
        <h3 className="text-base font-semibold text-content mb-3">
          {t("publish.connect_amazon")}
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            label={t("publish.seller_id_label")}
            placeholder="e.g. A1B2C3D4E5F6G7"
            value={sellerIdInput}
            onChange={(e) => setSellerIdInput(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-end">
            <Button
              variant="secondary"
              loading={connectionLoading}
              disabled={!sellerIdInput.trim()}
              onClick={handleConnect}
            >
              {t("publish.connect_button")}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderConfirmDialog = () => {
    if (!showConfirm) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setShowConfirm(false)}
        />
        <Card className="relative z-10 w-full max-w-md mx-4 shadow-xl">
          <h3 className="text-lg font-semibold text-content mb-2">
            {t("publish.confirm_dialog.title")}
          </h3>
          <p className="text-sm text-content/70 mb-6">
            {t("publish.confirm_dialog.message")}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              {t("copy_factory.editing.cancel")}
            </Button>
            <Button variant="primary" onClick={handlePublish}>
              {t("publish.publish_button")}
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderPublishResult = () => {
    if (!publishResult) return null;

    if (publishResult.type === "success") {
      return (
        <Card className="border-green-300 bg-green-50 mt-6">
          <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t("publish.publish_success")}
          </div>
          {publishResult.asin && (
            <p className="text-sm text-green-700 mb-1">
              ASIN: <span className="font-mono font-semibold">{publishResult.asin}</span>
            </p>
          )}
          {publishResult.seller_central_url && (
            <a
              href={publishResult.seller_central_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline inline-block mt-1"
            >
              {t("publish.view_on_amazon")}
            </a>
          )}
        </Card>
      );
    }

    return (
      <Card className="border-red-300 bg-red-50 mt-6">
        <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {t("publish.publish_failed")}
        </div>
        <p className="text-sm text-red-700 mb-3">{publishResult.error}</p>
        <Button variant="secondary" size="sm" onClick={() => setPublishResult(null)}>
          {t("image_factory.error_retry")}
        </Button>
      </Card>
    );
  };

  const renderStatusBadge = (status: PublishStatus) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
      >
        {t(`publish.status.${status}` as const)}
      </span>
    );
  };

  const renderNewPublishTab = () => {
    if (!connection.connected) {
      return (
        <div className="text-center py-16">
          <p className="text-content/60">{t("publish.empty_state.connect_first")}</p>
        </div>
      );
    }

    return (
      <div>
        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-content">
                {t("publish.listing_form.listing_title")}
              </label>
              <textarea
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-edge bg-white px-4 py-2 text-sm text-content
                  placeholder:text-gray-400 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
              />
            </div>

            {/* Bullet Points */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-content">
                {t("publish.listing_form.bullets")}
              </label>
              {form.bullets.map((bullet, i) => (
                <textarea
                  key={i}
                  value={bullet}
                  onChange={(e) => handleBulletChange(i, e.target.value)}
                  placeholder={`Bullet ${i + 1}`}
                  rows={2}
                  className="w-full rounded-lg border border-edge bg-white px-4 py-2 text-sm text-content
                    placeholder:text-gray-400 transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
                />
              ))}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-content">
                {t("publish.listing_form.description")}
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
                className="w-full rounded-lg border border-edge bg-white px-4 py-2 text-sm text-content
                  placeholder:text-gray-400 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Input
              label={t("publish.listing_form.images")}
              placeholder="https://..."
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
            />
            <Input
              label={t("publish.listing_form.sku")}
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
            <Input
              label={t("publish.listing_form.price")}
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              label={t("publish.listing_form.quantity")}
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            <Input
              label={t("publish.listing_form.category")}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
        </div>

        {/* Form error */}
        {formError && (
          <p className="text-sm text-red-600 mt-2">{formError}</p>
        )}

        {/* Publish button */}
        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            loading={publishing}
            disabled={publishing}
            onClick={() => setShowConfirm(true)}
          >
            {publishing ? t("publish.publishing") : t("publish.publish_button")}
          </Button>
        </div>

        {/* Publish result */}
        {renderPublishResult()}

        {/* Confirmation dialog */}
        {renderConfirmDialog()}
      </div>
    );
  };

  const renderHistoryTab = () => {
    return (
      <div>
        {/* Filter */}
        <div className="mb-4">
          <select
            value={historyFilter}
            onChange={(e) =>
              handleFilterChange(e.target.value as PublishStatus | "all")
            }
            className="rounded-lg border border-edge bg-white px-4 py-2 text-sm text-content
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">{t("publish.history.filter_all")}</option>
            <option value="published">{t("publish.history.filter_published")}</option>
            <option value="failed">{t("publish.history.filter_failed")}</option>
            <option value="draft">{t("publish.history.filter_draft")}</option>
          </select>
        </div>

        {/* Table */}
        {historyLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-content/60">{t("publish.empty_state.no_records")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge">
                  <th className="text-left py-3 px-2 font-medium text-content/70">
                    {t("publish.listing_form.listing_title")}
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-content/70">
                    {t("publish.listing_form.sku")}
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-content/70">ASIN</th>
                  <th className="text-left py-3 px-2 font-medium text-content/70">
                    {t("publish.status.label")}
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-content/70">
                    {t("publish.listing_form.price")}
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-content/70">
                    {t("publish.history.date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-edge hover:bg-primary-light/50 cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === record.id ? null : record.id)
                    }
                  >
                    <td className="py-3 px-2 max-w-[200px] truncate font-medium">
                      {record.title || "-"}
                    </td>
                    <td className="py-3 px-2">{record.sku || "-"}</td>
                    <td className="py-3 px-2 font-mono">{record.asin || "-"}</td>
                    <td className="py-3 px-2">
                      {renderStatusBadge(record.status)}
                    </td>
                    <td className="py-3 px-2">
                      {record.price != null
                        ? `$${Number(record.price).toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="py-3 px-2 whitespace-nowrap">
                      {formatDateTime(record.created_at)}
                    </td>
                  </tr>
                ))}
                {/* Expanded rows */}
                {records.map(
                  (record) =>
                    expandedId === record.id && (
                      <tr key={`${record.id}-expanded`}>
                        <td colSpan={6} className="px-2 pb-3">
                          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                            {record.error_message && (
                              <p className="text-red-700">
                                <span className="font-medium">Error:</span>{" "}
                                {record.error_message}
                              </p>
                            )}
                            {record.asin && record.seller_central_url && (
                              <a
                                href={record.seller_central_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline inline-block"
                              >
                                {t("publish.view_on_amazon")}
                              </a>
                            )}
                            {!record.error_message && !record.seller_central_url && (
                              <p className="text-content/50 text-xs">
                                ID: {record.id}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-edge hover:bg-primary-light transition-colors disabled:opacity-40"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              Prev
            </button>
            <span className="text-sm text-content/70 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              className="px-3 py-1.5 text-sm rounded-lg border border-edge hover:bg-primary-light transition-colors disabled:opacity-40"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ---- Main render ------------------------------------------------- */

  return (
    <div>
      <h2 className="text-2xl font-bold text-content mb-6">
        {t("publish.title")}
      </h2>

      {/* Connection banner */}
      {renderConnectionBanner()}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-edge mb-6">
        <button
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "new"
              ? "border-primary text-primary"
              : "border-transparent text-content/60 hover:text-content"
          }`}
          onClick={() => setActiveTab("new")}
        >
          {t("publish.title")}
        </button>
        <button
          className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-content/60 hover:text-content"
          }`}
          onClick={() => setActiveTab("history")}
        >
          {t("publish.history.history_title")}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "new" ? renderNewPublishTab() : renderHistoryTab()}
    </div>
  );
}
