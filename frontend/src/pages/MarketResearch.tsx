import { useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

type ResearchTab = "trending" | "keywords" | "competitors";

interface TrendingProduct {
  id: string;
  name: string;
  category: string;
  growth: number;
  price_range: string;
  platform: string;
  rank: number;
}

const MOCK_TRENDING: TrendingProduct[] = [
  {
    id: "1",
    name: "Wireless Earbuds Pro",
    category: "Electronics",
    growth: 245,
    price_range: "$25-45",
    platform: "Amazon",
    rank: 1,
  },
  {
    id: "2",
    name: "Eco-Friendly Water Bottle",
    category: "Home & Kitchen",
    growth: 189,
    price_range: "$12-22",
    platform: "Amazon",
    rank: 2,
  },
  {
    id: "3",
    name: "LED Ring Light Kit",
    category: "Electronics",
    growth: 167,
    price_range: "$30-60",
    platform: "eBay",
    rank: 3,
  },
  {
    id: "4",
    name: "Posture Corrector Brace",
    category: "Health & Personal Care",
    growth: 152,
    price_range: "$15-28",
    platform: "Amazon",
    rank: 4,
  },
  {
    id: "5",
    name: "Desk Cable Management Kit",
    category: "Office Products",
    growth: 138,
    price_range: "$8-18",
    platform: "Amazon",
    rank: 5,
  },
];

const TAB_KEYS: { key: ResearchTab; label: string }[] = [
  { key: "trending", label: "Trending Products" },
  { key: "keywords", label: "Keyword Research" },
  { key: "competitors", label: "Competitor Analysis" },
];

export function MarketResearch() {
  const [activeTab, setActiveTab] = useState<ResearchTab>("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("US");

  const filtered = MOCK_TRENDING.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-content">
            Market Research
          </h2>
          <p className="text-sm text-content/60 mt-1">
            Discover trending products, analyze keywords, and track competitors
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="rounded-lg border border-edge bg-white px-4 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="US">🇺🇸 United States</option>
            <option value="UK">🇬🇧 United Kingdom</option>
            <option value="DE">🇩🇪 Germany</option>
            <option value="JP">🇯🇵 Japan</option>
          </select>
          <Button variant="primary" size="md">
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-edge">
        {TAB_KEYS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors duration-200 border-b-2 -mb-px ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-content/50 hover:text-content/70 hover:border-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "trending" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or categories..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-edge bg-white text-sm text-content placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge">
                    <th className="text-left py-3 px-2 font-medium text-content/70 w-12">
                      #
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-content/70">
                      Product
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-content/70">
                      Category
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-content/70">
                      Growth
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-content/70">
                      Price Range
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-content/70">
                      Platform
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-content/70">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-edge hover:bg-primary-light/50 transition-colors"
                    >
                      <td className="py-3 px-2 font-bold text-content/50">
                        {product.rank}
                      </td>
                      <td className="py-3 px-2 font-medium text-content">
                        {product.name}
                      </td>
                      <td className="py-3 px-2 text-content/70">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-medium">
                            +{product.growth}%
                          </span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{
                                width: `${Math.min(product.growth / 2.5, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-content/70">
                        {product.price_range}
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-xs font-medium text-content/60">
                          {product.platform}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <Button variant="ghost" size="sm">
                          Analyze
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "keywords" && (
        <Card>
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <h3 className="font-semibold text-lg text-content mb-2">
              Keyword Research Coming Soon
            </h3>
            <p className="text-sm text-content/60 max-w-md mx-auto">
              AI-powered keyword discovery with search volume, competition analysis, and trend forecasting. This feature is under active development.
            </p>
          </div>
        </Card>
      )}

      {activeTab === "competitors" && (
        <Card>
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="font-semibold text-lg text-content mb-2">
              Competitor Analysis Coming Soon
            </h3>
            <p className="text-sm text-content/60 max-w-md mx-auto">
              Track competitor pricing, promotions, and listing strategies across multiple platforms with AI-driven insights.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
