import { useState } from "react";

const modules = [
  {
    icon: "📊", title: "Market Research", tag: "选品分析",
    desc: "AI-powered trending product discovery, keyword research with competition analysis, and competitor intelligence across 7 global markets.",
    features: ["Trending product rankings", "Keyword volume & competition", "Competitor strategy analysis", "Cross-link to Copy Factory"],
  },
  {
    icon: "💡", title: "Product Planner", tag: "品类规划",
    desc: "Generate complete product concepts from a category idea — AI designs specs, pricing, features, and analyzes market fit.",
    features: ["Concept generation", "Spec recommendations", "Market fit analysis", "Competitive advantage"],
  },
  {
    icon: "✍️", title: "Copy Factory", tag: "文案工厂",
    desc: "Multi-market, multi-language AI copywriting. 7 markets × 5 languages with per-market cultural adaptation.",
    features: ["Titles & bullet points", "HTML descriptions", "Keyword recommendations", "7 markets × 5 languages"],
  },
  {
    icon: "🖼️", title: "Image Factory", tag: "图片工厂",
    desc: "AI background removal and scene generation in 8 artistic styles — Minimal, Lifestyle, Premium, Dark, Nature, Urban, Vintage, Neon.",
    features: ["Background removal", "8 scene styles", "Batch processing", "One-click to listing"],
  },
  {
    icon: "🎯", title: "Marketing Hub", tag: "营销中心",
    desc: "AI campaign planning, short-video scripts, social media posts, ad copy, and audience profiling — all in one place.",
    features: ["Campaign strategy", "Video scripts", "Social posts & ads", "Audience profiling"],
  },
  {
    icon: "🚀", title: "Multi-Platform Publish", tag: "一键发布",
    desc: "Unified publishing to Amazon, eBay, Shopify, and TikTok Shop. Connect once, publish everywhere.",
    features: ["4 platforms", "Unified listing form", "Platform accounts", "Publish history"],
  },
];

const pricing = [
  { name: "Free Trial", price: "$0", credits: "10 image + 5 text", features: ["All modules", "1 user", "Community support"], cta: "Start Free", popular: false },
  { name: "Starter", price: "$19/mo", credits: "50 image + 30 text", features: ["All modules", "1 user", "Email support", "7 markets"], cta: "Get Started", popular: false },
  { name: "Growth", price: "$49/mo", credits: "150 image + 100 text", features: ["All modules", "3 users", "Priority support", "API access", "Analytics export"], cta: "Get Started", popular: true },
  { name: "Pro", price: "$129/mo", credits: "500 image + 300 text", features: ["All modules", "10 users", "Dedicated support", "API access", "White-label"], cta: "Contact Us", popular: false },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌐</span>
            <span className="font-bold text-lg">Global AI Commerce Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#modules" className="text-sm text-gray-600 hover:text-gray-900">Modules</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="/login" className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50">Login</a>
            <a href="/login" className="px-4 py-2 text-sm font-medium rounded-lg bg-black text-white hover:bg-gray-800">Try Free →</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-medium mb-8">
          🚀 Powered by DeepSeek AI
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
          Your AI-Powered<br />
          <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Cross-Border Commerce Hub</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          From market research to product design, copywriting, image generation, marketing campaigns, and multi-platform publishing — all powered by AI, all in one place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="/login" className="px-8 py-3.5 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition-colors text-lg">
            Start Free Trial →
          </a>
          <a href="#modules" className="px-8 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-lg">
            See Modules ↓
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-gray-100">
          {[
            { value: "7", label: "Markets" },
            { value: "5", label: "Languages" },
            { value: "8", label: "AI Modules" },
            { value: "53+", label: "API Endpoints" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">8 AI-Powered Modules</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              End-to-end cross-border e-commerce workflow — research → design → create → market → publish
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => (
              <div key={m.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all group">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-600">{m.tag}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{m.title}</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{m.desc}</p>
                <ul className="space-y-1.5">
                  {m.features.map((f) => (
                    <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-purple-400" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">One Unified Workflow</h2>
          <p className="text-lg text-gray-500 mb-12">From idea to listing — all AI-powered, all in one platform</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
            {["🔍 Market Research", "💡 Product Design", "✍️ AI Copywriting", "🖼️ Image Generation", "🎯 Marketing Planning", "🚀 Publishing"].map((step, i) => (
              <span key={step}>
                <span className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 inline-block">{step}</span>
                {i < 5 && <span className="mx-2 text-gray-300">→</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-lg text-gray-500">Pay for what you use. Start free, scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricing.map((p) => (
              <div key={p.name} className={`relative bg-white rounded-2xl p-6 border-2 ${p.popular ? "border-purple-500 shadow-lg" : "border-gray-100"}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-purple-500 text-white text-xs font-bold">Most Popular</span>}
                <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                <p className="text-3xl font-extrabold text-gray-900 mt-3">{p.price}</p>
                <p className="text-sm text-gray-500 mt-1">{p.credits}</p>
                <ul className="mt-6 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="/login" className={`block text-center mt-6 px-4 py-2.5 rounded-xl font-semibold text-sm ${p.popular ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} transition-colors`}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Engine */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
            🤖 AI Engine
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Powered by DeepSeek</h2>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            We use DeepSeek's latest chat model via OpenAI-compatible API. High-quality AI generation at a fraction of the cost of competitors. Supports structured JSON output, multi-language generation, and real-time market analysis.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { title: "Fast & Affordable", desc: "~$0.28/M input tokens. Significantly lower cost than GPT-4 with comparable quality for e-commerce tasks." },
              { title: "Multi-Language Native", desc: "Fluent in English, Chinese, German, Japanese, French — with cultural context awareness for each market." },
              { title: "Structured Outputs", desc: "JSON-mode generation for reliable structured data — product tables, keyword lists, competitor matrices." },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold mb-4">Ready to Scale Your Cross-Border Business?</h2>
          <p className="text-lg text-gray-400 mb-8">Join thousands of SMB sellers using AI to dominate global markets.</p>
          <a href="/login" className="inline-block px-10 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-100 transition-colors">
            Start Free Trial →
          </a>
          <p className="text-sm text-gray-500 mt-4">No credit card required. 10 image + 5 text credits free.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-400">
          <p>© 2026 Global AI Commerce Hub. Built with DeepSeek AI + FastAPI + React.</p>
        </div>
      </footer>
    </div>
  );
}
