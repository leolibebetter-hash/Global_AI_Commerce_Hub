import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

interface DashboardSummary {
  credits: { image_credits: number; text_credits: number };
  stats: {
    total_campaigns: number;
    total_marketing_content: number;
    total_market_research: number;
    total_published: number;
    publish_by_platform: Record<string, number>;
    content_by_type: Record<string, number>;
  };
  recent_activity: Array<{
    type: string;
    title: string;
    status?: string;
    module: string;
    platform?: string;
    analysis_type?: string;
    created_at: string;
  }>;
}

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch("/api/dashboard/summary", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const quickActions = [
    { label: t("nav.market_research"), desc: "Analyze trends, keywords & competitors", to: "/market-research", color: "bg-blue-500" },
    { label: t("nav.copy_factory"), desc: "AI copywriting for product listings", to: "/copy-factory", color: "bg-green-500" },
    { label: t("nav.image_factory"), desc: "AI-powered product image generation", to: "/image-factory", color: "bg-purple-500" },
    { label: t("nav.marketing"), desc: "Campaign planning & content creation", to: "/marketing", color: "bg-orange-500" },
    { label: t("nav.publish"), desc: "One-click multi-platform publishing", to: "/publish", color: "bg-red-500" },
  ];

  const platforms = data?.stats.publish_by_platform || {};
  const contentTypes = data?.stats.content_by_type || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-content">{t("nav.dashboard")}</h2>
        <p className="text-sm text-content/60 mt-1">Welcome back to your AI Commerce Hub</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Image Credits" value={data?.credits.image_credits ?? "—"} color="text-purple-600" bg="bg-purple-50" />
        <StatCard label="Text Credits" value={data?.credits.text_credits ?? "—"} color="text-green-600" bg="bg-green-50" />
        <StatCard label="Campaigns" value={data?.stats.total_campaigns ?? 0} color="text-orange-600" bg="bg-orange-50" />
        <StatCard label="Published" value={data?.stats.total_published ?? 0} color="text-blue-600" bg="bg-blue-50" />
      </div>

      {/* Module Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Marketing Content Breakdown */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-content/70 mb-3 uppercase tracking-wide">Marketing Content</h3>
          <div className="space-y-2">
            {Object.entries(contentTypes).length === 0 && (
              <p className="text-sm text-content/50">No content yet</p>
            )}
            {Object.entries(contentTypes).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-sm capitalize">{k.replace(/_/g, " ")}</span>
                <span className="text-sm font-semibold">{v}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-content/50 mt-3">
            Total: {data?.stats.total_marketing_content ?? 0} + {data?.stats.total_campaigns ?? 0} campaigns
          </p>
        </Card>

        {/* Publish by Platform */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-content/70 mb-3 uppercase tracking-wide">Publish by Platform</h3>
          <div className="space-y-2">
            {Object.entries(platforms).length === 0 && (
              <p className="text-sm text-content/50">No records yet</p>
            )}
            {Object.entries(platforms).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-sm capitalize">{k}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (v / (data?.stats.total_published || 1)) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-semibold">{v}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-content/50 mt-3">Research: {data?.stats.total_market_research ?? 0} analyses</p>
        </Card>

        {/* Recent Activity */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm text-content/70 mb-3 uppercase tracking-wide">Recent Activity</h3>
          <div className="space-y-3">
            {(data?.recent_activity || []).length === 0 && (
              <p className="text-sm text-content/50">No recent activity</p>
            )}
            {(data?.recent_activity || []).slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  item.module === "marketing" ? "bg-orange-500" :
                  item.module === "publish" ? "bg-blue-500" :
                  "bg-green-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-content/50">{item.module} &middot; {item.type}</p>
                </div>
                {item.created_at && (
                  <span className="text-xs text-content/50 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-lg text-content mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((action) => (
            <button key={action.to} onClick={() => navigate(action.to)}
              className="p-4 rounded-xl border border-edge hover:border-primary/50 hover:shadow-md text-left transition-all group">
              <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                <span className="text-white text-xs font-bold">{action.label.charAt(0)}</span>
              </div>
              <h4 className="font-semibold text-sm text-content group-hover:text-primary">{action.label}</h4>
              <p className="text-xs text-content/50 mt-0.5">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Workflow Guide */}
      <Card className="bg-gradient-to-r from-primary/5 to-white p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-content">Recommended Workflow</h3>
            <p className="text-sm text-content/60 mt-1">
              Market Research → Copy Factory → Image Factory → Marketing Hub → Publish
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate("/market-research")}>
            Start Research
          </Button>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color, bg }: { label: string; value: number | string; color: string; bg: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-content/60 font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
          <div className={`w-3 h-3 rounded-full ${color.replace("text-", "bg-")}`} />
        </div>
      </div>
    </Card>
  );
}
