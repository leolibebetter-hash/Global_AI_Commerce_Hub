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
