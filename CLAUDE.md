# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Global AI Commerce Hub is an AI-driven cross-border e-commerce ERP system for SMB sellers. It covers market research/product selection, product design & listing preparation, and multi-channel marketing — using AI (Claude API) to automate and optimize these workflows.

The PRD is at `docs/初始草稿_260528.txt` (Chinese-language PRD, v1.0, 2026-05-28).

## Tech Stack (from PRD)

- **Backend:** Python (prefer FastAPI per PRD suggestion). Claude API for NLP, content generation, image generation, and data analysis.
- **Frontend:** React or Vue.js with responsive design (desktop + mobile).
- **Databases:** PostgreSQL or MySQL for relational data; MongoDB for unstructured data where appropriate.
- **Data ingestion:** Scrapy for web scraping, plus third-party data services and platform APIs.
- **Cloud:** AWS / Google Cloud / Azure for compute, storage, and API gateway.

## Architecture: Three Core Modules

The system is organized into three functional modules (see PRD §2 for full details):

1. **选品与市场分析 (Product Selection & Market Analysis)** — Aggregates sales/social data from platforms (Amazon, eBay, TikTok Shop, etc.) to identify trending products, analyze market topics, and track global/regional trends. Includes competitor analysis and sentiment analysis of user-generated content.

2. **品类设计与上架准备 (Category Design & Listing Preparation)** — AI-assisted product concept generation, spec recommendations, AI image generation/optimization, AI copywriting (multi-language), keyword/tag recommendations, SKU management, and one-click multi-platform publishing.

3. **营销与推广整合 (Marketing & Promotion)** — AI-generated marketing campaign ideas, content creation (short video scripts, social posts, ad copy), audience profiling, short-video management (TikTok, YouTube Shorts, Reels), social media content management, and SEM assistance (Google Ads, Bing Ads).

## MVP Scope (Phase 1)

- Core product selection & market analysis
- AI copywriting + keyword recommendations
- Basic multi-platform publishing (1–2 platforms)

## Development Guidelines

- **API-first design:** Every backend feature is exposed via REST API consumed by the frontend and potentially by third-party integrations.
- **Multi-platform integration:** Design platform adapters as abstractions over individual platform APIs (Amazon, eBay, Shopify, TikTok Shop, etc.) since each has unique interfaces. Expect ongoing maintenance as platform APIs change.
- **Module boundaries:** The three modules should be independently deployable services/contexts that share a common user/auth/data layer.
- **AI integration:** The Claude API is the central AI engine. Prompt design and caching strategies are critical for cost and latency control — every AI-generated output (copy, images, analysis) goes through Claude.
- **i18n from day one:** The system targets global markets; all user-facing content must support multi-language, including AI-generated copy localized per target market.
- **Data compliance:** Design data storage and processing with GDPR and international privacy regulations in mind. Platform data scraping must respect API ToS and rate limits.

## Git Workflow (MANDATORY)

**CRITICAL: EVERY change MUST go through a Pull Request. Never push directly to `master` or `develop`.**

### Branch Strategy

```
master   ← 生产稳定版 (protected, no direct pushes)
  ↑ PR
develop  ← 开发主线 (default branch)
  ↑ PR
feature/xxx  ← 功能分支 (all work happens here)
```

### Workflow Steps

1. **Create a feature branch from `develop`:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/<short-description>
   ```

2. **Work on the feature, commit incrementally:**
   - Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
   - Every commit must end with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

3. **Push the feature branch and create a PR:**
   ```bash
   git push -u origin feature/<short-description>
   gh pr create --base develop --head feature/<short-description> --title "..." --body "..."
   ```

4. **Wait for user review and approval before merging.**

5. **After merge to develop, create a PR from `develop` → `master` for release:**
   ```bash
   gh pr create --base master --head develop --title "Release: ..." --body "..."
   ```

6. **User approves and merges to master.**

### Commit Message Format

```
<type>: <short description>

<detailed body if needed>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

Types: `feat` (feature), `fix` (bug fix), `chore` (maintenance), `docs` (documentation), `refactor` (code restructuring), `test` (tests).

### What NOT to Commit

- `.env` / `.env.example` — sensitive config, never in repo
- `README.md` — user preference, do not commit
- `node_modules/`, `.venv/`, `__pycache__/` — build artifacts (covered by `.gitignore`)
- `*.tsbuildinfo` — TypeScript build artifacts
- `.claude/` — Claude internal directory

### GitHub Repository

- **URL:** https://github.com/leolibebetter-hash/Global_AI_Commerce_Hub
- **Default branch:** `develop`
- **Auth:** Use `gh auth login` if not authenticated
