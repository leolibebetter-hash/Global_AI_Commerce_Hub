import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

type Stage = "idle" | "uploading" | "processing" | "done" | "error";

interface ImageResult {
  no_bg_url: string;
  scene_urls: string[];
}

interface ResultResponse {
  status: string;
  no_bg_url?: string;
  scene_urls?: string[];
  stage?: string;
  error?: string;
}

const STYLE_OPTIONS = [
  { value: "minimal", labelKey: "image_factory.style_minimal", swatch: "bg-gray-400" },
  { value: "lifestyle", labelKey: "image_factory.style_lifestyle", swatch: "bg-amber-400" },
  { value: "premium", labelKey: "image_factory.style_premium", swatch: "bg-yellow-700" },
] as const;

export function ImageFactory() {
  const { t } = useTranslation();

  // Core state
  const [stage, setStage] = useState<Stage>("idle");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("minimal");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState("");
  const [result, setResult] = useState<ImageResult | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [regenerateStyle, setRegenerateStyle] = useState("minimal");
  const [confirmed, setConfirmed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup object URLs and timers on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const processFile = useCallback(
    (file: File) => {
      const validTypes = ["image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setError(t("image_factory.upload_error_type"));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(t("image_factory.upload_error_size"));
        return;
      }

      // Revoke old preview URL to avoid memory leak
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStage("idle");
      setResult(null);
      setSelectedImages(new Set());
      setError(null);
      setConfirmed(false);
      setTaskId(null);
      setCurrentStage("");
    },
    [previewUrl, t]
  );

  // --- Drag-and-drop handlers ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset input value so the same file can be re-selected
      e.target.value = "";
    },
    [processFile]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // --- Process / Generate ---
  const handleProcess = useCallback(async () => {
    if (!uploadedFile) return;
    setStage("uploading");
    setCurrentStage(t("image_factory.stage_remove_bg"));
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("style", selectedStyle);

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/image-factory/process", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Upload failed (${res.status})`);
      }

      const data: { task_id: string; status?: string; stage?: string } =
        await res.json();
      setTaskId(data.task_id);
      setCurrentStage(data.stage || t("image_factory.stage_generate"));
      setStage("processing");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("image_factory.processing_error"));
      setStage("error");
    }
  }, [uploadedFile, selectedStyle, t]);

  // --- Polling for results ---
  useEffect(() => {
    if (stage !== "processing" || !taskId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/image-factory/result/${taskId}`, {
          headers,
        });

        if (!res.ok) {
          throw new Error(`Poll failed (${res.status})`);
        }

        const data: ResultResponse = await res.json();

        if (cancelled) return;

        if (data.status === "completed" && data.no_bg_url && data.scene_urls) {
          setResult({ no_bg_url: data.no_bg_url, scene_urls: data.scene_urls });
          setStage("done");
          setCurrentStage("");
        } else if (data.status === "failed") {
          throw new Error(data.error || t("image_factory.processing_error"));
        } else {
          // Still processing — update stage message
          const stageLabel =
            data.stage === "remove_bg"
              ? t("image_factory.stage_remove_bg")
              : data.stage === "generate"
                ? t("image_factory.stage_generate")
                : data.stage || data.status || "";
          setCurrentStage(stageLabel);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("image_factory.processing_error")
          );
          setStage("error");
        }
      }
    };

    // Poll immediately then every 2 seconds
    poll();
    const interval = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stage, taskId, t]);

  // --- Regenerate single scene ---
  const handleStartRegenerate = useCallback((index: number) => {
    setRegeneratingIndex(index);
    setRegenerateStyle("minimal");
  }, []);

  const handleCancelRegenerate = useCallback(() => {
    setRegeneratingIndex(null);
  }, []);

  const handleConfirmRegenerate = useCallback(async () => {
    if (regeneratingIndex === null || !result) return;

    const imageUrl = result.scene_urls[regeneratingIndex];
    if (!imageUrl) return;

    setRegeneratingIndex(null);
    setStage("processing");
    setCurrentStage(t("image_factory.stage_generate"));
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("image_url", imageUrl);
      formData.append("style", regenerateStyle);

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/image-factory/regenerate", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Regenerate failed (${res.status})`);
      }

      const data: { task_id: string } = await res.json();
      setTaskId(data.task_id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("image_factory.processing_error")
      );
      setStage("error");
    }
  }, [regeneratingIndex, regenerateStyle, result, t]);

  // --- Download helpers ---
  const downloadImage = useCallback(
    async (url: string, filename: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Network error");
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Fallback: open in new tab
        window.open(url, "_blank");
      }
    },
    []
  );

  const downloadAll = useCallback(() => {
    if (!result) return;
    result.scene_urls.forEach((url, i) => {
      downloadImage(url, `scene_${i + 1}.png`);
    });
  }, [result, downloadImage]);

  const downloadSelected = useCallback(() => {
    if (!result || selectedImages.size === 0) {
      showToast(t("image_factory.select_images"));
      return;
    }
    selectedImages.forEach((i) => {
      downloadImage(result.scene_urls[i], `scene_${i + 1}.png`);
    });
  }, [result, selectedImages, downloadImage, showToast, t]);

  // --- Selection toggle ---
  const toggleSelect = useCallback((index: number) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  // --- Confirm usage (deduct credits) ---
  const handleConfirm = useCallback(async () => {
    if (!result) return;
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("count", String(result.scene_urls.length));

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/image-factory/confirm", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Confirm failed (${res.status})`);
      }

      setConfirmed(true);
      showToast(
        t("image_factory.credits_used", { count: result.scene_urls.length })
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Confirm failed");
    }
  }, [result, showToast, t]);

  // --- Use in listing ---
  const handleUseInListing = useCallback(() => {
    showToast(t("image_factory.coming_in_phase3"));
  }, [showToast, t]);

  // --- Error retry ---
  const handleRetry = useCallback(() => {
    setError(null);
    setStage("idle");
  }, []);

  // --- Stage label for processing ---
  const stageLabel =
    currentStage || (stage === "uploading" ? t("image_factory.generating") : "");

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm max-w-sm animate-fade-in">
          {toast}
        </div>
      )}

      {/* Zoom modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={zoomImage}
              alt="Zoom"
              className="max-w-full max-h-[90vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-gray-800 shadow-md flex items-center justify-center text-lg font-bold hover:bg-gray-100 transition-colors"
              onClick={() => setZoomImage(null)}
              aria-label="Close zoom"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Page title */}
      <h2 className="text-2xl font-bold">{t("image_factory.title")}</h2>

      {/* Upload zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleUploadClick();
        }}
        aria-label={t("image_factory.upload_zone")}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleFileChange}
        />

        {previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 max-w-full h-auto rounded-lg object-contain"
            />
            <p className="text-sm text-gray-500">
              {uploadedFile?.name} ({(uploadedFile!.size / 1024 / 1024).toFixed(1)} MB)
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUploadClick();
              }}
            >
              {t("image_factory.upload_zone")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-base font-medium text-foreground">
              {t("image_factory.upload_zone")}
            </p>
            <p className="text-sm text-gray-500">
              {t("image_factory.upload_hint")}
            </p>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-red-300 bg-red-50">
          <div className="flex items-center justify-between">
            <p className="text-red-700 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              {t("image_factory.error_retry")}
            </Button>
          </div>
        </Card>
      )}

      {/* Style selector */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">
          {t("image_factory.style_minimal")} / {t("image_factory.style_lifestyle")} /{" "}
          {t("image_factory.style_premium")}
        </p>
        <div className="flex flex-wrap gap-3">
          {STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedStyle(opt.value)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                selectedStyle === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:border-gray-300"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full ${opt.swatch} ${
                  selectedStyle === opt.value ? "ring-2 ring-offset-1 ring-primary" : ""
                }`}
              />
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Process button */}
      <Button
        variant="primary"
        size="lg"
        loading={stage === "uploading" || stage === "processing"}
        disabled={!uploadedFile || stage === "processing" || stage === "uploading"}
        onClick={handleProcess}
        className="w-full md:w-auto"
      >
        {stage === "uploading" || stage === "processing"
          ? `${t("image_factory.generating")} ${stageLabel ? `(${stageLabel})` : ""}`
          : t("image_factory.generate")}
      </Button>

      {/* Results gallery */}
      {stage === "done" && result && (
        <div className="space-y-6">
          {/* Original + Background Removed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  {t("image_factory.original")}
                </p>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt={t("image_factory.original")}
                    className="max-w-full h-auto rounded-lg object-contain max-h-48 cursor-pointer"
                    onClick={() => setZoomImage(previewUrl)}
                  />
                )}
              </div>
            </Card>
            <Card>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  {t("image_factory.no_bg")}
                </p>
                <img
                  src={result.no_bg_url}
                  alt={t("image_factory.no_bg")}
                  className="max-w-full h-auto rounded-lg object-contain max-h-48 cursor-pointer"
                  onClick={() => setZoomImage(result.no_bg_url)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadImage(result.no_bg_url, "no_bg.png")}
                >
                  {t("image_factory.download")}
                </Button>
              </div>
            </Card>
          </div>

          {/* Scene images */}
          <div>
            <p className="text-sm font-medium text-gray-500 mb-3">
              {t("image_factory.scenes")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.scene_urls.map((url, i) => (
                <Card key={i} className="relative">
                  <div className="space-y-2">
                    <div className="relative group">
                      <img
                        src={url}
                        alt={`${t("image_factory.scenes")} ${i + 1}`}
                        className="max-w-full h-auto rounded-lg object-contain cursor-pointer"
                        onClick={() => setZoomImage(url)}
                      />
                      {/* Regenerate overlay */}
                      <button
                        type="button"
                        onClick={() => handleStartRegenerate(i)}
                        className="absolute top-2 right-2 px-2.5 py-1 text-xs font-medium bg-white/90 rounded-md shadow-sm text-foreground hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {t("image_factory.regenerate")}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedImages.has(i)}
                          onChange={() => toggleSelect(i)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        {t("image_factory.download")}
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadImage(url, `scene_${i + 1}.png`)}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </Button>
                    </div>

                    {/* Inline regenerate style picker */}
                    {regeneratingIndex === i && (
                      <div className="pt-2 border-t border-border mt-2 space-y-2">
                        <p className="text-xs font-medium text-gray-500">
                          {t("image_factory.regenerate_style")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {STYLE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setRegenerateStyle(opt.value)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
                                regenerateStyle === opt.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-foreground hover:border-gray-300"
                              }`}
                            >
                              <span className={`w-2.5 h-2.5 rounded-full ${opt.swatch}`} />
                              {t(opt.labelKey)}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleConfirmRegenerate}
                          >
                            {t("image_factory.confirm_regenerate")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelRegenerate}
                          >
                            {t("image_factory.cancel")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Action bar */}
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={downloadSelected}
                disabled={selectedImages.size === 0}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {t("image_factory.download_selected")}
              </Button>
              <Button variant="outline" size="md" onClick={downloadAll}>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {t("image_factory.download_all")}
              </Button>
              <div className="flex-1" />
              <Button
                variant="secondary"
                size="md"
                onClick={handleConfirm}
                disabled={confirmed}
              >
                {confirmed ? "✓ " : ""}
                {t("image_factory.confirm")}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleUseInListing}
                disabled={!confirmed}
              >
                {t("image_factory.use_in_listing")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* No images placeholder */}
      {stage === "idle" && !previewUrl && (
        <p className="text-sm text-gray-400 text-center py-4">
          {t("image_factory.no_images")}
        </p>
      )}
    </div>
  );
}
