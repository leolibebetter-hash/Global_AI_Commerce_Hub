# Marketing Module Design Spec

**Module:** 营销与推广整合 (Marketing & Promotion Integration)  
**Version:** 0.1.0 (MVP)  
**Date:** 2026-06-06  
**Status:** Draft → Implementation

---

## 1. Overview

The Marketing module is Module 3 of the Global AI Commerce Hub. It provides AI-powered marketing campaign planning, social media content generation, and audience profiling for cross-border e-commerce sellers.

### MVP Scope (Phase 2 aligned with PRD)

- AI marketing campaign planning (theme ideas, content strategy, channel suggestions)
- AI social content generation (short-video scripts, social posts, ad copy)
- AI audience profile analysis
- Lightweight campaign & content management

### Out of Scope (Phase 3+)

- Actual platform publishing (TikTok API, YouTube API, etc.)
- SEM campaign execution (Google Ads/Bing Ads API integration)
- Email marketing
- Affiliate marketing

---

## 2. Architecture

### Approach: Hybrid Mode (Skill Pattern + Lightweight Campaign Container)

The module follows existing project patterns while adding campaign-level organization:

- **AI Generation Layer:** Skill-based generators (same pattern as `copy_skills`) for each content type
- **Organization Layer:** Lightweight Campaign entity to group related content pieces
- **API Layer:** REST endpoints under `/api/marketing/`

### System Diagram

```
Frontend (React/TS)
  └── /marketing page (3 tabs: Campaign | Content | Audience)
        │
        ▼
Backend (FastAPI)
  ├── /api/marketing/generate-campaign    ─┐
  ├── /api/marketing/generate-script       ├── AI Generation (DeepSeek API)
  ├── /api/marketing/generate-post         │
  ├── /api/marketing/generate-ad-copy      │
  ├── /api/marketing/audience-profile     ─┘
  ├── /api/marketing/campaigns             ── CRUD
  └── /api/marketing/contents              ── CRUD
        │
        ▼
Database (SQLite/SQLAlchemy)
  ├── marketing_campaigns
  └── marketing_contents
```

---

## 3. Data Model

### Table: `marketing_campaigns`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String(36) | PK, UUID | Campaign ID |
| user_id | String(36) | FK→users, NOT NULL | Owner |
| name | String(200) | NOT NULL | Campaign name |
| description | Text | NULLABLE | Campaign description |
| target_market | String(10) | NOT NULL, default "US" | Target market code |
| target_audience | Text | NULLABLE | Target audience description |
| objective | String(50) | NOT NULL, default "brand_awareness" | Campaign objective |
| status | String(20) | NOT NULL, default "draft" | draft / active / completed |
| created_at | DateTime | NOT NULL, server_default=now() | Creation timestamp |
| updated_at | DateTime | NOT NULL, server_default=now(), onupdate=now() | Last update timestamp |

### Table: `marketing_contents`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String(36) | PK, UUID | Content ID |
| campaign_id | String(36) | FK→campaigns, NULLABLE | Linked campaign |
| user_id | String(36) | FK→users, NOT NULL | Owner |
| content_type | String(30) | NOT NULL | campaign_plan / video_script / social_post / ad_copy / audience_profile |
| title | String(300) | NOT NULL | Content title |
| body | Text | NOT NULL | Main content (markdown/JSON) |
| platform | String(30) | NOT NULL | Target platform |
| language | String(5) | NOT NULL, default "en" | Language code |
| metadata | JSON | NULLABLE | Extra data (tags, keywords, etc.) |
| created_at | DateTime | NOT NULL, server_default=now() | Creation timestamp |

---

## 4. API Design

All endpoints require Bearer token authentication via `Depends(get_current_user)`.  
AI generation endpoints deduct credits via `deduct_credits`.

### 4.1 AI Generation Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/marketing/generate-campaign` | Generate campaign plan (theme + strategy + channels) |
| POST | `/api/marketing/generate-script` | Generate short-video script (scenes + narration + music) |
| POST | `/api/marketing/generate-post` | Generate social media post (copy + hashtags + image hints) |
| POST | `/api/marketing/generate-ad-copy` | Generate ad copy (headline + description + CTA + keywords) |
| POST | `/api/marketing/audience-profile` | Analyze target audience profile |

#### Request/Response Schemas

**Generate Campaign Request:**
```json
{
  "product_name": "Wireless Earbuds Pro",
  "product_category": "Electronics",
  "product_features": ["ANC", "30h battery", "IPX5 waterproof"],
  "target_market": "US",
  "language": "en",
  "objective": "brand_awareness"
}
```

**Generate Script Request:**
```json
{
  "product_name": "Wireless Earbuds Pro",
  "product_features": ["ANC", "30h battery", "IPX5"],
  "target_audience": "18-35 tech enthusiasts",
  "platform": "tiktok",
  "language": "en",
  "tone": "energetic",
  "duration_seconds": 30
}
```

**Generate Post Request:**
```json
{
  "product_name": "...",
  "platform": "instagram",
  "language": "en",
  "tone": "professional",
  "key_message": "affordable premium audio"
}
```

**Generate Ad Copy Request:**
```json
{
  "product_name": "...",
  "target_market": "US",
  "platform": "google_ads",
  "language": "en",
  "objective": "conversion"
}
```

**Audience Profile Request:**
```json
{
  "product_category": "Electronics",
  "target_market": "US",
  "interests": ["audio", "tech", "fitness"],
  "language": "en"
}
```

### 4.2 Campaign Management Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/marketing/campaigns` | List user's campaigns |
| POST | `/api/marketing/campaigns` | Create a campaign |
| GET | `/api/marketing/campaigns/{id}` | Get campaign detail with linked contents |
| PUT | `/api/marketing/campaigns/{id}` | Update campaign |
| DELETE | `/api/marketing/campaigns/{id}` | Delete campaign |

### 4.3 Content Management Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/marketing/contents` | List user's contents (filter by type/platform) |
| GET | `/api/marketing/contents/{id}` | Get content detail |
| DELETE | `/api/marketing/contents/{id}` | Delete content |
| POST | `/api/marketing/contents/{id}/link` | Link content to a campaign |

---

## 5. Frontend Design

### Route

Add `/marketing` route to React Router, protected by `ProtectedRoute`, with `MarketingHub` page component.

### Navigation

Add "营销中心" (Marketing Hub) to the sidebar nav items with a megaphone icon.

### Page Structure: 3-Tab Layout

**Tab 1: 营销策划 (Campaign Planning)**
- Left panel: Product info form → Generate campaign
- Right panel: AI-generated result (theme, strategy, channel recommendations)
- Bottom: Campaign list (cards with name/status/actions — view, delete)

**Tab 2: 内容创作 (Content Creation)**
- Top: Content type toggle (Script / Post / Ad Copy)
- Left panel: Content-specific form (platform, tone, length, etc.)
- Right panel: Generated content display + copy-to-clipboard
- Option to link generated content to an existing campaign

**Tab 3: 受众分析 (Audience Profiling)**
- Input form: product category, target market, interest keywords
- Output cards: Demographics, Interests & Behaviors, Content Preferences, Platform Usage

### Component Reuse

Reuse existing: `Card`, `Button`, `Input`, `Layout` components.  
Use `apiFetch` from `lib/api.ts` for all API calls.  
Use `useTranslation` for i18n (zh/en).

---

## 6. File Structure

### Backend (new files)

```
backend/app/
├── models/
│   ├── marketing_campaign.py      # MarketingCampaign model
│   └── marketing_content.py       # MarketingContent model
├── schemas/
│   └── marketing.py               # Pydantic request/response schemas
├── api/
│   └── marketing.py               # API router (all marketing endpoints)
└── services/
    └── marketing_skills/
        ├── __init__.py
        ├── base.py                # Abstract base skill
        ├── campaign_planner.py    # Campaign planning skill
        ├── script_writer.py       # Video script skill
        ├── post_writer.py         # Social post skill
        ├── ad_copy_writer.py      # Ad copy skill
        ├── audience_analyzer.py   # Audience analysis skill
        └── registry.py            # Skill registry
```

### Frontend (new files)

```
frontend/src/
└── pages/
    └── MarketingHub.tsx           # Main marketing page with 3 tabs
```

### Modified files

```
backend/app/main.py                # Register marketing router
backend/app/models/__init__.py     # Import new models
frontend/src/App.tsx               # Add /marketing route
frontend/src/components/Layout.tsx # Add sidebar nav item
frontend/src/i18n/en.json          # English translations
frontend/src/i18n/zh.json          # Chinese translations
```

---

## 7. Error Handling & Edge Cases

- **Insufficient credits:** Return 402 with descriptive message
- **AI API failure:** Return 503 with retry hint; do not deduct credits
- **Empty input validation:** Pydantic validation on all requests
- **Campaign with linked contents:** Prevent deletion or warn user
- **Concurrent generation:** Each generation is independent (no locking needed)

---

## 8. Testing Strategy

- Unit tests for marketing skill registry and base skill
- API integration tests for generate and CRUD endpoints
- Frontend smoke test: page renders with 3 tabs, form submission triggers API call

---

## 9. Credit Pricing

| Action | Credits | Estimated API Cost |
|--------|---------|-------------------|
| generate-campaign | 2.0 | ~$0.008 |
| generate-script | 1.0 | ~$0.004 |
| generate-post | 0.5 | ~$0.002 |
| generate-ad-copy | 1.0 | ~$0.004 |
| audience-profile | 1.5 | ~$0.006 |

---

## 10. Future Extensions (Phase 3+)

- Platform API adapters (TikTok, YouTube, Instagram, Facebook)
- One-click publish to social platforms
- Content performance analytics (views, engagement, conversion)
- SEM campaign management (Google Ads, Bing Ads)
- Content calendar and scheduling
- Email marketing integration
- Affiliate marketing management
