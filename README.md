# Global AI Commerce Hub

AI-driven cross-border e-commerce ERP system for SMB sellers. Covers market research, product design & listing preparation, and multi-channel marketing — using AI (Claude API / DeepSeek) to automate and optimize e-commerce workflows.

## Architecture

```
Global_AI_Commerce_Hub/
├── frontend/          # React + TypeScript + Tailwind CSS + Vite
│   └── src/
│       ├── components/  # Reusable UI: Button, Card, Input, Layout
│       ├── pages/       # Dashboard, ImageFactory, CopyFactory, Publish, LoginPage
│       └── i18n/        # en.json, zh.json
├── backend/           # FastAPI + SQLAlchemy + Celery
│   └── app/
│       ├── api/         # REST endpoints: auth, copy-factory, image-factory, publish, usage
│       ├── core/        # Config, database, celery
│       ├── models/      # SQLAlchemy models
│       ├── schemas/     # Pydantic schemas
│       ├── services/    # Business logic: copy_skills, sp_api, deepseek, image_gen
│       └── tasks/       # Celery async tasks
└── docs/              # PRD and documentation
```

## Three Core Modules

1. **Product Selection & Market Analysis** — Aggregate sales/social data from platforms (Amazon, eBay, TikTok Shop) to identify trending products and analyze markets. (Phase 2+)

2. **Category Design & Listing Preparation** — AI-assisted copywriting, image generation, keyword recommendations, and multi-platform publishing. (MVP)

3. **Marketing & Promotion** — AI-generated marketing campaigns, short-video scripts, social posts, and SEM assistance. (Phase 3+)

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Vite
- **Backend:** Python 3.12+, FastAPI, SQLAlchemy, Celery
- **AI:** Claude API / DeepSeek API for NLP and content generation
- **Database:** PostgreSQL (via SQLAlchemy) + Redis (Celery broker)
- **Platform Integrations:** Amazon SP-API (mock available), extensible adapter pattern

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # or .venv/bin/activate on Unix
pip install -r requirements.txt
cp .env.example .env  # Edit with your settings
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

See `backend/.env.example` for required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET_KEY` — Secret for JWT token signing
- `DEEPSEEK_API_KEY` — DeepSeek API key for AI copy generation
- `CORS_ORIGINS` — Allowed CORS origins

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/usage/balance` | Get credit balance |
| GET | `/api/usage/summary` | Usage summary |
| POST | `/api/copy-factory/generate-all` | Generate all copy sections |
| POST | `/api/image-factory/process` | Process image (remove bg + scenes) |
| POST | `/api/publish/create` | Publish listing to Amazon |
| GET | `/api/publish/history` | Publish history |
| POST | `/api/amazon/connect` | Connect Amazon account |
| GET | `/api/health` | Health check |

## MVP Scope (Phase 1)

- [x] AI copywriting (title, bullets, description, keywords)
- [x] AI image generation (background removal, scene generation)
- [x] Basic multi-platform publishing (Amazon)
- [x] User authentication & credit system
- [x] i18n (English, Chinese)
- [ ] Product selection & market analysis (Phase 2)
- [ ] Marketing & promotion tools (Phase 3)

## License

Proprietary — all rights reserved.
