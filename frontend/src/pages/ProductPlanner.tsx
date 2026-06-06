import { useState } from "react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { apiFetch } from "../lib/api";

interface ConceptResult {
  id: string;
  name: string;
  category: string;
  market: string;
  concept_description: string;
  specs: Record<string, any> | null;
  target_price_range: string | null;
  design_notes: string | null;
  market_fit: string;
  competitive_advantage: string;
  credits_used: number;
}

const MARKETS = ["US", "UK", "DE", "JP", "FR", "CA", "AU"];
const PRICE_TIERS = ["low", "mid", "premium"];
const LANGUAGES = ["en", "zh", "de", "ja", "fr"];

function renderSelect(label: string, value: string, options: string[], onChange: (v: string) => void) {
  return (
    <div>
      <label className="block text-sm font-medium text-content/70 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-edge px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </div>
  );
}

export function ProductPlanner() {
  const [category, setCategory] = useState("");
  const [market, setMarket] = useState("US");
  const [audience, setAudience] = useState("general");
  const [priceTier, setPriceTier] = useState("mid");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConceptResult | null>(null);
  const [history, setHistory] = useState<ConceptResult[]>([]);

  async function handleGenerate() {
    if (!category) return;
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<ConceptResult>("/api/product-planner/generate", {
        method: "POST",
        body: JSON.stringify({ category, market, target_audience: audience, price_tier: priceTier, language }),
      });
      setResult(data);
      loadHistory();
    } catch (e: any) { setError(e.message || "Generation failed"); }
    finally { setLoading(false); }
  }

  async function loadHistory() {
    try {
      const data = await apiFetch<{ concepts: ConceptResult[] }>("/api/product-planner/concepts");
      setHistory(data.concepts);
    } catch { /* ignore */ }
  }

  const specs = result?.specs || {};

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Product Planner</h1>
        <p className="text-sm text-content/50 mt-1">AI-powered product concept generation & spec design</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">Generate Product Concept</h2>
          <div className="space-y-4">
            <Input label="Product Category" value={category} onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Kitchen Gadgets, Fitness Gear, Smart Home" />
            <Input label="Target Audience" value={audience} onChange={(e) => setAudience(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              {renderSelect("Market", market, MARKETS, setMarket)}
              {renderSelect("Price Tier", priceTier, PRICE_TIERS, setPriceTier)}
            </div>
            {renderSelect("Language", language, LANGUAGES, setLanguage)}
            <Button onClick={handleGenerate} loading={loading} className="w-full">
              Generate Concept
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </Card>

        {/* Result */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-4">Result</h2>
          {result ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-primary">{result.name}</h3>
                <p className="text-xs text-content/50">{result.category} &middot; {result.market}</p>
              </div>
              <p className="text-sm">{result.concept_description}</p>

              {specs.key_features && (
                <div>
                  <span className="text-sm font-medium text-content/70">Key Features</span>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {(specs.key_features as string[] || []).map((f: string, i: number) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {specs.material && <div className="text-sm"><span className="text-content/50">Material:</span> {specs.material}</div>}
                {specs.dimensions && <div className="text-sm"><span className="text-content/50">Dimensions:</span> {specs.dimensions}</div>}
                {specs.weight && <div className="text-sm"><span className="text-content/50">Weight:</span> {specs.weight}</div>}
                {result.target_price_range && <div className="text-sm"><span className="text-content/50">Price:</span> {result.target_price_range}</div>}
              </div>

              {result.market_fit && (
                <div className="bg-green-50 rounded-lg p-3">
                  <span className="text-xs font-medium text-green-700">Market Fit</span>
                  <p className="text-sm mt-0.5">{result.market_fit}</p>
                </div>
              )}

              {result.competitive_advantage && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-xs font-medium text-blue-700">Competitive Advantage</span>
                  <p className="text-sm mt-0.5">{result.competitive_advantage}</p>
                </div>
              )}

              {result.design_notes && (
                <div>
                  <span className="text-sm font-medium text-content/70">Design Notes</span>
                  <p className="text-sm mt-1">{result.design_notes}</p>
                </div>
              )}

              <p className="text-xs text-content/50">Credits used: {result.credits_used}</p>
            </div>
          ) : (
            <p className="text-content/50 text-sm">Enter a product category and generate an AI-powered concept.</p>
          )}
        </Card>
      </div>

      {/* History */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Concepts</h2>
          <Button variant="secondary" size="sm" onClick={loadHistory}>Refresh</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {history.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{c.name}</h4>
                  <p className="text-xs text-content/50 mt-1">{c.category} &middot; {c.market} &middot; {c.target_price_range}</p>
                  <p className="text-sm mt-2 line-clamp-2">{c.concept_description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
