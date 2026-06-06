# Global AI Commerce Hub

AI-driven cross-border e-commerce ERP system for SMB sellers. Covers market research, product design, listing preparation, and multi-channel marketing — using AI (DeepSeek API) to automate and optimize cross-border workflows.

## Architecture

```
Global AI Commerce Hub
├── 📊 Market Research     → Trend analysis, keyword research, competitor intelligence
├── 💡 Product Planner     → AI product concept generation & spec design
├── ✍️ Copy Factory        → 7 markets × 5 languages AI copywriting
├── 🖼️ Image Factory       → AI scene generation with 8 styles
├── 🎯 Marketing Hub       → Campaign planning, content creation, audience profiling
├── 🚀 Multi-Platform Push → Amazon, eBay, Shopify, TikTok Shop publishing
├── ⚙️  Settings            → Account profile, credits & usage
└── 📈 Dashboard           → Real-time stats across all modules
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 |
| Frontend | React 18, TypeScript, Tailwind CSS, i18next |
| AI Engine | DeepSeek API (via OpenAI SDK) |
| Database | SQLite (dev), PostgreSQL/MySQL (prod) |
| Task Queue | Celery + Redis (async image processing) |
| Auth | JWT Bearer tokens, phone + SMS login |

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- Redis (optional, for async tasks)

### Backend Setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate     # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set DEEPSEEK_API_KEY, JWT_SECRET_KEY

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev                  # → http://localhost:5173
```

### API Docs
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

## Module Reference

### 📊 Market Research (`/market-research`)
- AI trending product analysis with ranked tables
- Keyword research with search volume & competition badges
- Competitor analysis with strengths/weaknesses/strategy cards
- Keyword → Copy Factory cross-link via URL params
- 7 API endpoints

### 💡 Product Planner (`/product-planner`)
- AI product concept generation from category + market
- Auto-generates: specs, materials, dimensions, features, pricing
- Market fit analysis + competitive advantage
- Concept history for review
- 2 API endpoints

### ✍️ Copy Factory (`/copy-factory`)
- **7 markets**: US 🇺🇸 UK 🇬🇧 DE 🇩🇪 JP 🇯🇵 FR 🇫🇷 CA 🇨🇦 AU 🇦🇺
- **5 languages**: English, 中文, Deutsch, 日本語, Français
- Per-market AI localization hints (cultural adaptation)
- Market → language auto-matching
- 7 API endpoints

### 🖼️ Image Factory (`/image-factory`)
- **8 scene styles**: Minimal, Lifestyle, Premium, Dark, Nature, Urban, Vintage, Neon
- Background removal + AI scene generation
- Download & "Use in Listing" workflow
- 5 API endpoints

### 🎯 Marketing Hub (`/marketing`)
- **Campaign Planning**: AI theme, strategy, channel recommendations
- **Content Creator**: Video scripts (TikTok/YouTube/Reels), social posts (Instagram/Facebook/Twitter), ad copy (Google Ads/Bing Ads)
- **Audience Analysis**: Demographics, interests, platform usage, pain points
- Content & campaign CRUD management
- 15 API endpoints

### 🚀 Multi-Platform Publish (`/publish`)
- **4 platforms**: 📦 Amazon, 🛒 eBay, 🏪 Shopify, 🎵 TikTok Shop
- Unified PlatformAccount model
- Per-platform connection management
- Unified listing form + publish history with platform filter + pagination
- 6 API endpoints

### 📈 Dashboard (`/`)
- Real-time stats: credits, campaigns, content, published listings
- Publish by platform breakdown with progress bars
- Content by type summary
- Recent activity feed (last 10 items across all modules)
- 5 quick action cards

## API Summary

| Prefix | Endpoints | Description |
|--------|-----------|-------------|
| `/api/auth` | 4 | Phone + SMS registration & login |
| `/api/dashboard` | 1 | Module stats aggregation |
| `/api/copy-factory` | 7 | Title, bullets, description, keywords |
| `/api/image-factory` | 5 | Upload, style generation, download |
| `/api/market-research` | 7 | Trending, keywords, competitors + CRUD |
| `/api/marketing` | 15 | Campaign, script, post, ad copy, audience + CRUD |
| `/api/product-planner` | 2 | Concept generation + history |
| `/api/publish` | 6 | Multi-platform accounts + listing create |
| `/api/usage` | 3 | Balance, summary, history |
| `/api/amazon` | 1 | Legacy Amazon auth |
| `/api/files` | 2 | File upload/download |
| **Total** | **53** | |

## Project Structure

```
backend/app/
  api/              # REST route handlers (one file per module)
  models/           # SQLAlchemy ORM models
  schemas/          # Pydantic request/response schemas
  services/         # Business logic + AI skill implementations
  core/             # Config, database, Redis, Celery
  tasks/            # Celery async task definitions
backend/tests/      # pytest integration tests

frontend/src/
  pages/            # Page components (Dashboard, CopyFactory, etc.)
  components/       # Shared UI: Button, Card, Input, Layout
  i18n/             # zh.json + en.json translations
  lib/              # API client with auth token management

docs/superpowers/
  specs/            # Design specification documents
  plans/            # Implementation plans
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEEPSEEK_API_KEY` | DeepSeek API key | — |
| `DEEPSEEK_BASE_URL` | DeepSeek API endpoint | `https://api.deepseek.com` |
| `DATABASE_URL` | Database connection string | `sqlite:///./global_ai_hub.db` |
| `REDIS_URL` | Redis connection (Celery) | `redis://localhost:6379/0` |
| `JWT_SECRET_KEY` | JWT signing secret | — |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |
| `COPY_PROVIDER` | AI provider for copy | `deepseek` |
| `MARKETING_PROVIDER` | AI provider for marketing | `deepseek` |
| `MARKET_RESEARCH_PROVIDER` | AI provider for research | `deepseek` |
| `PLATFORM_ADAPTER_PROVIDER` | Platform adapter mode | `mock` |

## Testing

```bash
cd backend
pytest tests/ -v                         # Full test suite (~150 tests)
pytest tests/test_marketing.py -v        # Marketing module
pytest tests/test_market_research.py -v  # Market research
pytest tests/test_copy_factory.py -v     # Copy factory
```

## Development Workflow

All changes go through: feature branch → PR → Review → Merge

```bash
git checkout -b feature/my-feature
# implement & commit with conventional prefixes
git push -u origin feature/my-feature
gh pr create --base develop --head feature/my-feature
# review & merge after approval
```

See `CLAUDE.md` for full development guidelines.

## License

Proprietary — all rights reserved.
