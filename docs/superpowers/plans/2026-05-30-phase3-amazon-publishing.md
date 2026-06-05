# Phase 3: Amazon Publishing Integration — Implementation Plan

> **Goal:** OAuth Amazon Seller account → SP-API Listings Items API → create draft listing → status tracking → history.

**Prerequisite:** Amazon SP-API developer registration (pending user action — 1-2 week review). Build with mock SP-API client for now.

**Architecture:** SP-API client abstraction with mock implementation for dev. Token storage AES-256 encrypted. Retry with exponential backoff. Publish records tracked in DB.

---

## Sub-Phase 3.1: SP-API Client

**`backend/app/services/sp_api/`** directory

- `base.py` — `SPAPIClient` abstract class
- `mock_client.py` — returns fake ASINs and success statuses
- `amazon_client.py` — real SP-API calls (OAuth + Listings Items API v2)
- `registry.py` — factory function

## Sub-Phase 3.2: Amazon Account Linking

- `backend/app/models/amazon_account.py` — stores encrypted SP-API tokens per user
- `backend/app/api/amazon_auth.py` — OAuth flow endpoints
- Token encryption service

## Sub-Phase 3.3: Publishing Workflow

- `backend/app/models/publish_record.py` — track each publish attempt
- `backend/app/api/publish.py` — publish endpoints
- Data mapper: internal listing format → Amazon product type JSON
- Status polling background task

## Sub-Phase 3.4: Publishing UI

- Amazon account connection page
- Publishing review page (images + copy + SKU final check)
- Publish button + real-time status
- Publishing history page with status filters

## Sub-Phase 3.5: Tests
