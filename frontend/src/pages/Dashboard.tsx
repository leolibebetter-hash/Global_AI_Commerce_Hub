import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

interface Balance {
  image_credits: number;
  text_credits: number;
}

interface UsageSummary {
  total_images: number;
  total_text: number;
  total_published: number;
}

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [summary, setSummary] = useState<UsageSummary>({
    total_images: 0,
    total_text: 0,
    total_published: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Fetch balance
    fetch("/api/usage/balance", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setBalance)
      .catch(() => {});

    // Fetch usage summary
    fetch("/api/usage/summary", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  }, []);

  const quickActions = [
    {
      label: t("nav.image_factory"),
      desc: "AI-powered product image generation",
      to: "/image-factory",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: t("nav.copy_factory"),
      desc: "AI copywriting for product listings",
      to: "/copy-factory",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: t("nav.publish"),
      desc: "One-click multi-platform publishing",
      to: "/publish",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-content">
          {t("nav.dashboard")}
        </h2>
        <p className="text-sm text-content/60 mt-1">
          Welcome back to your AI Commerce Hub
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Image Credits */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-content/60 font-medium">Image Credits</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {balance?.image_credits ?? "—"}
              </p>
              <p className="text-xs text-content/50 mt-0.5">remaining</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Text Credits */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-content/60 font-medium">Text Credits</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {balance?.text_credits ?? "—"}
              </p>
              <p className="text-xs text-content/50 mt-0.5">remaining</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Images Generated */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-content/60 font-medium">Images Generated</p>
              <p className="text-3xl font-bold text-content mt-1">
                {summary.total_images}
              </p>
              <p className="text-xs text-content/50 mt-0.5">lifetime</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Published */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-content/60 font-medium">Published</p>
              <p className="text-3xl font-bold text-content mt-1">
                {summary.total_published}
              </p>
              <p className="text-xs text-content/50 mt-0.5">listings</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-lg text-content mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card key={action.to} className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group" onClick={() => navigate(action.to)}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-fg transition-colors shrink-0">
                  {action.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-content group-hover:text-primary transition-colors">
                    {action.label}
                  </h4>
                  <p className="text-sm text-content/60 mt-0.5">{action.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card className="bg-gradient-to-r from-primary-light to-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-content">
              Getting Started
            </h3>
            <p className="text-sm text-content/60 mt-1">
              Follow the workflow: analyze your market → generate product copy → create images → publish listings.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => navigate("/copy-factory")}>
            Start Creating
          </Button>
        </div>
      </Card>
    </div>
  );
}
