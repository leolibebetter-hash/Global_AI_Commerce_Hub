# Global AI Commerce Hub — Master Task Plan

**Created:** 2026-05-30 | **PRD:** V2.0 | **MVP Platform:** Amazon (SP-API)

---

## Skill Inventory

| # | Skill | Type | Usage in This Project |
|---|-------|------|----------------------|
| S1 | `superpowers:brainstorming` | Process | Before each Phase's creative/design work |
| S2 | `superpowers:writing-plans` | Process | Multi-step implementation planning per Phase |
| S3 | `superpowers:test-driven-development` | Process | All feature & bugfix implementation |
| S4 | `superpowers:subagent-driven-development` | Process | Execute plans with parallel independent tasks |
| S5 | `superpowers:dispatching-parallel-agents` | Process | Frontend + backend parallel work |
| S6 | `superpowers:verification-before-completion` | Process | Before any "done" / "fixed" / "passing" claim |
| S7 | `superpowers:requesting-code-review` | Process | After completing major features, before merge |
| S8 | `superpowers:systematic-debugging` | Process | Any bug, test failure, or unexpected behavior |
| S9 | `superpowers:using-git-worktrees` | Process | Feature isolation per Phase |
| S10 | `superpowers:finishing-a-development-branch` | Process | Phase completion — merge/PR/cleanup decisions |
| S11 | `ui-ux-pro-max:ui-ux-pro-max` | Implementation | All UI pages, components, design system |
| S12 | `andrej-karpathy-skills:karpathy-guidelines` | Implementation | All code — simplicity, surgical changes, goal-driven |
| S13 | — (DeepSeek API) | Implementation | OpenAI-compatible chat completion, no special skill needed — standard SDK patterns |
| — | `claude-api` skill | REMOVED | User has no Claude API access; DeepSeek replaces it for all text generation |

---

## Phase 0: Infrastructure (Week 1–2)

**Goal:** Project scaffold, database, user system, payments, storage, base UI.

### Task 0.0 — Environment & API Account Setup

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | — (manual/ops) |
| **Supporting Skills** | — |

**Subtasks:**
- [ ] 0.0.1 Register DeepSeek API account (platform.deepseek.com), create API key, verify pricing (~$0.14/M input tokens — far cheaper than Claude)
- [ ] 0.0.2 Register Stability AI / Replicate account, note per-image pricing
- [ ] 0.0.3 Register remove.bg / Clipdrop API account
- [ ] 0.0.4 Apply for Amazon SP-API developer access (1-2 week review cycle — **START NOW**)
- [ ] 0.0.5 Register Alipay Open Platform (企业资质 + 营业执照 needed, 3-5 working days)
- [ ] 0.0.6 Register WeChat Pay merchant account (公司主体 needed, 3-5 working days)
- [ ] 0.0.7 Register Alibaba Cloud SMS (报备短信模板, 1 day)
- [ ] 0.0.8 Create AWS account, configure Singapore region, create S3 bucket + CloudFront CDN

### Task 0.1 — Project Scaffolding & Monorepo Setup

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:writing-plans` |
| **Supporting Skills** | `andrej-karpathy-skills:karpathy-guidelines`, `superpowers:using-git-worktrees` |

**Subtasks:**
- [ ] 0.1.1 Initialize git repo, create `.gitignore`, branch strategy
- [ ] 0.1.2 Scaffold FastAPI backend (`backend/`) — Python 3.11, project structure, dependencies
- [ ] 0.1.3 Scaffold React frontend (`frontend/`) — React 18 + TypeScript + Tailwind CSS + Vite
- [ ] 0.1.4 Local dev setup — MySQL 8.0 + Redis 7 (installed directly on host, no Docker)
- [ ] 0.1.5 Configure linting (Ruff for Python, ESLint + Prettier for TS)
- [ ] 0.1.6 Set up environment variable management (`.env` pattern, never commit secrets)
- [ ] 0.1.7 Initialize i18n framework (react-i18next, `zh.json` + `en.json` with `snake_case` keys)

### Task 0.2 — Database Modeling

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:writing-plans` |
| **Supporting Skills** | `superpowers:test-driven-development` |

**Subtasks:**
- [ ] 0.2.1 Design MySQL schema — users, user_sessions, user_ai_usage, ai_transactions, recharge_orders
- [ ] 0.2.2 Write Alembic migration scripts
- [ ] 0.2.3 Create SQLAlchemy ORM models
- [ ] 0.2.4 Seed scripts for dev/test data
- [ ] 0.2.5 Redis configuration for session cache + Celery broker

### Task 0.3 — User Registration & Authentication

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `superpowers:writing-plans`, `ui-ux-pro-max:ui-ux-pro-max` |

**Subtasks:**
- [ ] 0.3.1 Phone + password registration endpoint (with SMS verification via Alibaba Cloud SMS)
- [ ] 0.3.2 SMS verification code send + verify endpoints (rate-limited)
- [ ] 0.3.3 Login endpoint (JWT access + refresh token)
- [ ] 0.3.4 WeChat OAuth login (QR code scan flow)
- [ ] 0.3.5 Registration/login UI pages (mobile-first, bilingual)
- [ ] 0.3.6 Password reset flow
- [ ] 0.3.7 Sub-account management (US-017 — admin creates sub-accounts with AI usage caps)

### Task 0.4 — Payment Integration

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `superpowers:writing-plans`, `ui-ux-pro-max:ui-ux-pro-max` |

**Subtasks:**
- [ ] 0.4.1 Alipay SDK integration — create order, handle callback, verify signature
- [ ] 0.4.2 WeChat Pay SDK integration — Native QR code payment, handle callback
- [ ] 0.4.3 Balance management API (query balance, transaction history)
- [ ] 0.4.4 Recharge/credits UI pages (US-015, US-016)
- [ ] 0.4.5 Payment reconciliation background job

### Task 0.5 — File Storage (AWS S3)

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | — |

**Subtasks:**
- [ ] 0.5.1 S3 client wrapper (upload, presigned URL, delete)
- [ ] 0.5.2 File upload API endpoint (size limit 10MB, JPEG/PNG validation)
- [ ] 0.5.3 CloudFront CDN configuration for image serving

### Task 0.6 — Base UI Framework

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `ui-ux-pro-max:ui-ux-pro-max` |
| **Supporting Skills** | `superpowers:brainstorming`, `andrej-karpathy-skills:karpathy-guidelines` |

**Subtasks:**
- [ ] 0.6.1 Generate design system via `ui-ux-pro-max` search.py (e-commerce SaaS tool)
- [ ] 0.6.2 Layout shell — sidebar navigation + main content area + responsive
- [ ] 0.6.3 Component library foundation — Button, Input, Modal, Toast, Card, Table, Spinner
- [ ] 0.6.4 i18n language switcher (中文 / English toggle)
- [ ] 0.6.5 Mobile responsive verification (375px → 1440px)
- [ ] 0.6.6 Accessibility baseline — focus rings, contrast ratios, keyboard nav

### Task 0.7 — AI Usage Tracking & Billing Engine

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | — |

**Subtasks:**
- [ ] 0.7.1 `user_ai_usage` table + CRUD API
- [ ] 0.7.2 Usage deduction service (transactional — prevent concurrent over-deduction)
- [ ] 0.7.3 Balance check middleware/decorator for AI endpoints
- [ ] 0.7.4 New user free credits grant (10 images + 5 text generations)
- [ ] 0.7.5 Usage dashboard API + UI (US-015)

---

## Phase 1: Image Factory (Week 3–4)

**Goal:** Upload white-background image → remove background → AI scene generation → preview → download.

### Task 1.0 — Image Factory Design & Plan

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:brainstorming` |
| **Supporting Skills** | `ui-ux-pro-max:ui-ux-pro-max`, `superpowers:writing-plans` |

**Subtasks:**
- [ ] 1.0.1 Brainstorm image factory UX flow (upload → style select → preview → confirm)
- [ ] 1.0.2 Write implementation plan for Phase 1
- [ ] 1.0.3 Review plan, get approval

### Task 1.1 — Image Upload Service

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `ui-ux-pro-max:ui-ux-pro-max`, `andrej-karpathy-skills:karpathy-guidelines` |

**Subtasks:**
- [ ] 1.1.1 Drag-and-drop upload component with preview (US-001)
- [ ] 1.1.2 File validation (JPEG/PNG only, ≤10MB, dimension check ≥1000px)
- [ ] 1.1.3 Upload progress indicator + error states
- [ ] 1.1.4 Upload to S3, return CDN URL

### Task 1.2 — Background Removal Integration

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | — |

**Subtasks:**
- [ ] 1.2.1 remove.bg / Clipdrop API client wrapper (US-001)
- [ ] 1.2.2 Async background removal endpoint
- [ ] 1.2.3 Result storage (transparent PNG to S3)
- [ ] 1.2.4 Usage deduction on successful removal (¥0.5/次)

### Task 1.3 — AI Scene Generation

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `superpowers:dispatching-parallel-agents` |

**Subtasks:**
- [ ] 1.3.1 Stability AI / Replicate API client wrapper (SDXL / Flux)
- [ ] 1.3.2 Prompt builder — construct scene prompts from product context + style choice (US-001, US-002)
- [ ] 1.3.3 Celery async task for image generation (10-30s generation time)
- [ ] 1.3.4 Polling endpoint for task status (pending → processing → done/failed)
- [ ] 1.3.5 Post-processing — resize to 2000×2000, convert to JPEG, RGB color space
- [ ] 1.3.6 Usage deduction per generated image (¥2.0/张)

### Task 1.4 — Scene Style Selection & Regeneration

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `ui-ux-pro-max:ui-ux-pro-max` |
| **Supporting Skills** | `superpowers:test-driven-development` |

**Subtasks:**
- [ ] 1.4.1 Style selector UI — 简约 / 生活化 / 高端 presets (US-002)
- [ ] 1.4.2 Image result gallery — 3 generated variants side-by-side
- [ ] 1.4.3 Regenerate button with style change (single image re-generation)
- [ ] 1.4.4 Image comparison / zoom on hover
- [ ] 1.4.5 Selection confirmation + "use in listing" flow

### Task 1.5 — Batch Operations & Download

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `ui-ux-pro-max:ui-ux-pro-max` |

**Subtasks:**
- [ ] 1.5.1 Batch download — all confirmed images as ZIP (US-003)
- [ ] 1.5.2 "Use in publishing" — link confirmed images to listing workflow
- [ ] 1.5.3 Image management page — view/delete/re-download history

---

## Phase 2: Copy Factory (Week 5–6)

**Goal:** Product details input → DeepSeek generates Listing (title + bullets + description) → bilingual preview → optimize.

### Task 2.0 — Copy Factory Design & Plan

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:brainstorming` |
| **Supporting Skills** | `superpowers:writing-plans` |

**Subtasks:**
- [ ] 2.0.1 Brainstorm copy factory UX — product info form → AI generation → edit → confirm
- [ ] 2.0.2 Write implementation plan for Phase 2
- [ ] 2.0.3 Design DeepSeek API prompt architecture (OpenAI-compatible, system/user message pattern)

### Task 2.1 — DeepSeek API Integration

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `andrej-karpathy-skills:karpathy-guidelines` |

**Subtasks:**
- [ ] 2.1.1 DeepSeek API client setup — OpenAI SDK (`openai` Python package) pointed at DeepSeek base URL + error handling & retry
- [ ] 2.1.2 System prompt design — Amazon Listing specialist persona, structured output format specs (JSON mode)
- [ ] 2.1.3 Prompt template management — reusable templates for title/bullets/description with product context injection
- [ ] 2.1.4 Structured output parsing — extract title, bullets, description from DeepSeek response
- [ ] 2.1.5 Token usage tracking per request (log input/output tokens via API response)
- [ ] 2.1.6 Max token guard per user per day

### Task 2.2 — Listing Title Generation (US-004)

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `ui-ux-pro-max:ui-ux-pro-max` |

**Subtasks:**
- [ ] 2.2.1 Title generation prompt — ≤200 chars, main keyword included, Amazon-compliant format
- [ ] 2.2.2 Title generation API endpoint (async streaming)
- [ ] 2.2.3 Title editor component — live character count, keyword highlight
- [ ] 2.2.4 Regenerate title with different keyword emphasis

### Task 2.3 — Bullet Points Generation (US-005)

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `ui-ux-pro-max:ui-ux-pro-max` |

**Subtasks:**
- [ ] 2.3.1 Bullet points prompt — 5 bullets, each highlighting a core selling point with long-tail keywords
- [ ] 2.3.2 Bullet generation API endpoint
- [ ] 2.3.3 Bullet editor component — reorder, edit, add/delete bullets
- [ ] 2.3.4 Per-bullet keyword density visualization

### Task 2.4 — Product Description Generation (US-006)

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `ui-ux-pro-max:ui-ux-pro-max` |

**Subtasks:**
- [ ] 2.4.1 Description prompt — 250-2000 words, HTML tags (`<br>`, `<b>`) support
- [ ] 2.4.2 Description generation API endpoint
- [ ] 2.4.3 Rich text editor component — HTML preview + source toggle
- [ ] 2.4.4 Word count display

### Task 2.5 — Keyword Integration (US-009, US-010)

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | — |

**Subtasks:**
- [ ] 2.5.1 Keyword API client wrapper (Jungle Scout / DataHawk — choose one)
- [ ] 2.5.2 Keyword recommendation endpoint — 20-30 keywords with search volume tier & competition
- [ ] 2.5.3 Keyword-to-content mapping — mark which keywords appear in title/bullets/description
- [ ] 2.5.4 Keyword management UI — add/remove manually, real-time coverage update
- [ ] 2.5.5 Usage deduction per keyword query (¥0.5/次)

### Task 2.6 — Bilingual Preview & Optimization (US-007, US-008)

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `ui-ux-pro-max:ui-ux-pro-max` |
| **Supporting Skills** | `superpowers:test-driven-development` |

**Subtasks:**
- [ ] 2.6.1 Side-by-side 中文/English preview panel (US-008)
- [ ] 2.6.2 "One-click optimize" — re-target specific keywords to adjust density (US-007)
- [ ] 2.6.3 Content score card — keyword density %, char count compliance, readability indicators
- [ ] 2.6.4 Copy-to-clipboard for each section

### Task 2.7 — Copy Factory Integration

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `ui-ux-pro-max:ui-ux-pro-max` |

**Subtasks:**
- [ ] 2.7.1 "Generate All" — single button triggers title + bullets + description generation in parallel
- [ ] 2.7.2 Full listing preview page — images + copy together as Amazon mockup
- [ ] 2.7.3 Copy version history — save drafts, revert to previous
- [ ] 2.7.4 Usage deduction per full generation (¥1.5/次)

---

## Phase 3: Amazon Publishing Integration (Week 7–8)

**Goal:** OAuth Amazon Seller account → SP-API Listings Items API → draft listing → status tracking.

### Task 3.0 — SP-API Design & Plan

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:brainstorming` |
| **Supporting Skills** | `superpowers:writing-plans` |

**Subtasks:**
- [ ] 3.0.1 Review Amazon SP-API documentation (Listings Items API v2, Product Types)
- [ ] 3.0.2 Design OAuth flow, token storage (encrypted), refresh strategy
- [ ] 3.0.3 Write implementation plan for Phase 3

### Task 3.1 — Amazon SP-API OAuth Integration

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `ui-ux-pro-max:ui-ux-pro-max` |

**Subtasks:**
- [ ] 3.1.1 SP-API OAuth 2.0 authorization flow (US-011)
- [ ] 3.1.2 Token storage — AES-256 encrypted in DB, never logged
- [ ] 3.1.3 Token refresh logic with exponential backoff retry
- [ ] 3.1.4 "Connect Amazon Account" UI — OAuth redirect + callback + status display
- [ ] 3.1.5 Account disconnect / re-authorize flow

### Task 3.2 — Listing Creation via SP-API

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `andrej-karpathy-skills:karpathy-guidelines` |

**Subtasks:**
- [ ] 3.2.1 Product Types API — fetch category-specific schema/requirements
- [ ] 3.2.2 Listings Items API v2 client — create draft listing
- [ ] 3.2.3 Data mapper — internal listing format → Amazon product type JSON
- [ ] 3.2.4 Image upload to Amazon (via SP-API upload API) with URL mapping
- [ ] 3.2.5 Exponential backoff retry wrapper for all SP-API calls

### Task 3.3 — Publishing Workflow UI

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `ui-ux-pro-max:ui-ux-pro-max` |
| **Supporting Skills** | `superpowers:test-driven-development` |

**Subtasks:**
- [ ] 3.3.1 Publishing review page — images + copy + SKU info (price, inventory) final check (US-011)
- [ ] 3.3.2 "Publish to Amazon" button with confirmation dialog
- [ ] 3.3.3 Real-time publishing status display (US-012) — pending → submitting → draft created → done
- [ ] 3.3.4 Error display with actionable messages + Amazon Seller Central deep link
- [ ] 3.3.5 Post-publish summary — ASIN, listing URL, status

### Task 3.4 — Publishing History

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | `ui-ux-pro-max:ui-ux-pro-max` |

**Subtasks:**
- [ ] 3.4.1 Publishing records API — list, filter by status, paginate
- [ ] 3.4.2 Publishing history page (US-013) — status: 草稿 / 已发布 / 发布失败
- [ ] 3.4.3 Re-publish from history (retry failed)
- [ ] 3.4.4 Status polling background job for in-progress publishes

---

## Phase 4: Polish & Launch (Week 9–10)

**Goal:** Bug fixes, performance, error handling, docs, beta launch.

### Task 4.1 — Bug Fixes & User Feedback

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:systematic-debugging` |
| **Supporting Skills** | `superpowers:verification-before-completion` |

**Subtasks:**
- [ ] 4.1.1 Internal testing — run all user stories (US-001 through US-017), log issues
- [ ] 4.1.2 Fix all P0/P1 bugs
- [ ] 4.1.3 Edge case hardening — network failures, API timeouts, invalid inputs

### Task 4.2 — Performance Optimization

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:verification-before-completion` |
| **Supporting Skills** | `andrej-karpathy-skills:karpathy-guidelines` |

**Subtasks:**
- [ ] 4.2.1 API response time — target <300ms (non-AI endpoints), add Redis caching
- [ ] 4.2.2 Image generation pipeline — optimize Celery queue, add priority lanes
- [ ] 4.2.3 Frontend bundle optimization — code splitting, lazy loading, image optimization
- [ ] 4.2.4 Database query optimization — add missing indexes, analyze slow queries
- [ ] 4.2.5 Load test — verify 500 concurrent users (AWS ECS auto-scaling)

### Task 4.3 — Error Handling & Monitoring

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:test-driven-development` |
| **Supporting Skills** | — |

**Subtasks:**
- [ ] 4.3.1 Structured logging — CloudWatch + JSON log format
- [ ] 4.3.2 Sentry error tracking integration
- [ ] 4.3.3 Health check endpoints + AWS load balancer health checks
- [ ] 4.3.4 Graceful degradation — what happens when each external API is down
- [ ] 4.3.5 User-facing error messages audit — all errors actionable and bilingual

### Task 4.4 — Help Documentation

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `ui-ux-pro-max:ui-ux-pro-max` |
| **Supporting Skills** | — |

**Subtasks:**
- [ ] 4.4.1 Onboarding guide (first-time user flow)
- [ ] 4.4.2 Feature help pages — image factory, copy factory, publishing
- [ ] 4.4.3 FAQ page
- [ ] 4.4.4 Video walkthrough (optional)

### Task 4.5 — Beta Launch Preparation

| Field | Value |
|-------|-------|
| **Progress** | 0% |
| **Primary Skill** | `superpowers:verification-before-completion` |
| **Supporting Skills** | `superpowers:finishing-a-development-branch` |

**Subtasks:**
- [ ] 4.5.1 Beta invite code system — generate + validate invite codes
- [ ] 4.5.2 Production deployment — AWS ECS/EKS, configure domains + SSL
- [ ] 4.5.3 New user onboarding email (with invite code)
- [ ] 4.5.4 NPS survey setup for beta users (target: ≥10 users, NPS ≥7)
- [ ] 4.5.5 Launch checklist — all systems go / no-go review

---

## Summary

| Phase | Tasks | Weeks | Cumulative Progress |
|-------|-------|-------|---------------------|
| Phase 0: Infrastructure | 7 tasks (0.0–0.7) | 1–2 | 0% |
| Phase 1: Image Factory | 6 tasks (1.0–1.5) | 3–4 | 0% |
| Phase 2: Copy Factory | 8 tasks (2.0–2.7) | 5–6 | 0% |
| Phase 3: Publishing | 5 tasks (3.0–3.4) | 7–8 | 0% |
| Phase 4: Polish & Launch | 5 tasks (4.1–4.5) | 9–10 | 0% |
| **Total** | **31 tasks** | **10 weeks** | **0%** |

### Critical Path Alerts

- **Task 0.0.4** (Amazon SP-API application) — 1-2 week review cycle, start immediately
- **Task 0.0.5/6** (Alipay/WeChat payment) — requires 企业资质, 3-5 working days
- **Phase 3** depends on Task 0.0.4 completion
- **Phase 1** depends on Task 0.0.2/3 (Replicate + remove.bg accounts)
- **Phase 2** depends on Task 0.0.1 (DeepSeek API key)

### Skill Usage Heatmap

| Skill | P0 | P1 | P2 | P3 | P4 |
|-------|----|----|----|----|-----|
| `test-driven-development` | ████ | ████ | ████ | ████ | ██ |
| `ui-ux-pro-max` | ████ | ███ | ████ | ███ | ██ |
| `karpathy-guidelines` | ██ | ██ | ██ | ██ | ██ |
| `brainstorming` | ██ | ██ | ██ | ██ | — |
| `writing-plans` | ██ | ██ | ██ | ██ | — |
| DeepSeek API (OpenAI SDK) | — | — | ████ | — | — |
| `verification-before-completion` | ██ | ██ | ██ | ██ | ██ |
| `systematic-debugging` | — | — | — | — | ████ |
