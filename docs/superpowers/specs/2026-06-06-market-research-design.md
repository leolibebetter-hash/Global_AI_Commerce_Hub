# Market Research Module Design Spec

**Module:** 选品与市场分析 (Product Selection & Market Analysis)  
**Version:** 0.2.0 (Deepen from starter to full AI-powered module)  
**Date:** 2026-06-06  
**Status:** Draft

---

## 1. Overview

Upgrade the existing Market Research module from a static mock-data shell into an AI-powered market intelligence platform. The module helps cross-border e-commerce sellers identify trending products, research keywords, and analyze competitors using AI-generated insights.

### MVP Scope

- AI-powered trending product analysis with ranked recommendations
- AI-powered keyword research with search volume and competition estimates
- AI-powered competitor analysis with differentiation strategies
- Lightweight result persistence for history review
- Cross-link: keywords from market research can feed into Copy Factory

### Out of Scope (Phase 2+)

- Real platform API data ingestion (Amazon Product API, eBay API, etc.)
- Social media UGC analysis and sentiment tracking
- Global/regional trend tracking with seasonal predictions
- Policy/regulation alerts

---

## 2. Architecture

### Approach: Hybrid Mode (Skill Pattern + Lightweight Result Storage)

Follows the successful marketing module pattern:

- **AI Generation Layer:** Skill-based generators for each analysis type (trending, keywords, competitors)
- **Storage Layer:** Single `market_research_results` table with type-discriminated structured data
- **API Layer:** REST endpoints under `/api/market-research/`

### System Diagram

```
Frontend (React/TS)
  └── /market-research page (3 tabs: Trending | Keywords | Competitors)
        │
        ▼
Backend (FastAPI)
  ├── /api/market-research/analyze-trending    ─┐
  ├── /api/market-research/analyze-keywords     ├── AI Generation (DeepSeek API)
  ├── /api/market-research/analyze-competitors ─┘
  ├── /api/market-research/results             ── List/Get/Delete saved results
  └── /api/market-research/results/{id}        ── Get/Delete single result
        │
        ▼
Database (SQLite/SQLAlchemy)
  └── market_research_results
```

---

## 3. Data Model

### Table: `market_research_results`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String(36) | PK, UUID | Result ID |
| user_id | String(36) | FK→users, NOT NULL, INDEX | Owner |
| analysis_type | String(30) | NOT NULL | trending / keywords / competitors |
| query_params | JSON | NOT NULL | User's query (category, market, keywords, etc.) |
| title | String(300) | NOT NULL | Result title |
| body | Text | NOT NULL | Full AI analysis report (markdown) |
| summary | Text | NOT NULL | One-line summary for list display |
| platform | String(30) | NOT NULL | Target platform |
| market | String(10) | NOT NULL | Target market |
| metadata_ | JSON | NULLABLE | Structured data for charts/tables |
| credits_used | Float | NOT NULL, default 0 | Credits consumed |
| created_at | DateTime | NOT NULL, server_default=now() | Creation timestamp |

---

## 4. API Design

All endpoints require Bearer token via `Depends(get_current_user)`.  
AI analysis endpoints deduct credits via `deduct_credits`.

### 4.1 AI Analysis Endpoints

| Method | Path | Credits | Description |
|--------|------|---------|-------------|
| POST | `/api/market-research/analyze-trending` | 2.0 | Analyze trending products in a category |
| POST | `/api/market-research/analyze-keywords` | 1.5 | Research keywords with volume/competition |
| POST | `/api/market-research/analyze-competitors` | 2.0 | Analyze competitors for a product |

#### Request Schemas

**analyze-trending:**
```json
{
  "category": "Electronics",
  "market": "US",
  "platform": "amazon",
  "language": "en"
}
```

**analyze-keywords:**
```json
{
  "product_category": "Home & Kitchen",
  "seed_keywords": ["eco friendly", "reusable"],
  "market": "US",
  "language": "en"
}
```

**analyze-competitors:**
```json
{
  "product_name": "Wireless Earbuds Pro",
  "product_features": ["ANC", "30h battery", "IPX5"],
  "market": "US",
  "platform": "amazon",
  "language": "en"
}
```

#### Response Schema (unified)

```json
{
  "result": {
    "id": "uuid",
    "analysis_type": "trending",
    "title": "...",
    "summary": "one-line summary",
    "body": "markdown report text",
    "structured_data": { /* type-specific JSON */ },
    "market": "US",
    "platform": "amazon",
    "created_at": "..."
  },
  "credits_used": 2.0
}
```

**structured_data by type:**
- `trending`: `{ products: [{ name, category, growth_pct, price_range, platform, rank, insight }] }`
- `keywords`: `{ keywords: [{ keyword, search_volume, competition, relevance, suggested_bid }] }`
- `competitors`: `{ competitors: [{ name, price, rating, strengths, weaknesses, strategy }], differentiation_opportunities: [] }`

### 4.2 Result Management Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/market-research/results` | List user's saved results (filter by analysis_type) |
| GET | `/api/market-research/results/{id}` | Get single result detail |
| DELETE | `/api/market-research/results/{id}` | Delete a result |

---

## 5. Frontend Design

### Route

Existing `/market-research` route, existing `MarketResearch.tsx` page — refactored from static mock to AI-interactive.

### Tab Structure (3 tabs, same as current)

**Tab 1: 爆款选品 (Trending Products)**
- Form: category selector + market + platform + language
- "AI 分析" button triggers `analyze-trending`
- Result area: markdown report + ranked product table (from structured_data)
- Below: "历史分析" section with recent results from GET /results?type=trending

**Tab 2: 关键词研究 (Keyword Research)**
- Form: product category + seed keywords (tag input) + market
- Result: keyword table (search volume, competition, relevance) + trend tags
- Action button: "用于文案工厂" → navigates to `/copy-factory?keywords=kw1,kw2,kw3`

**Tab 3: 竞品分析 (Competitor Analysis)**
- Form: product name + features (tag input) + platform + market
- Result: competitor comparison table + differentiation opportunities + pricing advice

### Component Reuse

- Card, Button, Input from existing components
- apiFetch for API calls
- useTranslation for i18n (zh/en)
- Tab bar styling from existing pattern

---

## 6. File Structure

### Backend (new files)

```
backend/app/
├── models/
│   └── market_research.py          # MarketResearchResult model
├── schemas/
│   └── market_research.py          # Pydantic request/response schemas
├── api/
│   └── market_research.py          # API router (analysis + results CRUD)
└── services/
    └── market_research_skills/
        ├── __init__.py
        ├── base.py                 # Abstract base classes + context/result dataclasses
        ├── registry.py             # Skill provider registry
        ├── trending_analyzer.py    # Trending products analysis skill
        ├── keyword_researcher.py   # Keyword research skill
        └── competitor_analyzer.py  # Competitor analysis skill
```

### Backend (modified files)

```
backend/app/main.py                 # Register market_research router
backend/app/models/__init__.py      # Import new model
backend/app/core/config.py          # Add market_research_provider
```

### Frontend (modified files)

```
frontend/src/pages/MarketResearch.tsx  # Refactor from static to AI-interactive
frontend/src/i18n/zh.json             # Update/add market research translations
frontend/src/i18n/en.json             # Update/add market research translations
```

---

## 7. Error Handling & Edge Cases

- **Insufficient credits:** Return 402
- **AI API failure:** Return 503, do not deduct credits
- **Empty category/query:** Pydantic validation returns 422
- **Empty result history:** Show "No research results yet" placeholder
- **Copy Factory link:** Pass keywords via URL query params, Copy Factory page reads them on mount

---

## 8. Testing Strategy

- Unit tests for market research skill registry
- API integration tests for analyze endpoints and CRUD
- Verify credits deduction on successful analysis
- Frontend: page renders with 3 interactive tabs

---

## 9. Credit Pricing

| Action | Credits | Est. API Cost |
|--------|---------|---------------|
| analyze-trending | 2.0 | ~$0.008 |
| analyze-keywords | 1.5 | ~$0.006 |
| analyze-competitors | 2.0 | ~$0.008 |
