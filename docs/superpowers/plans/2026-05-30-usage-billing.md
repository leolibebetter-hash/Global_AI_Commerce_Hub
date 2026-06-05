# AI Usage Tracking & Billing Engine — Implementation Plan

> **Goal:** Usage deduction service, balance check, usage history API, and dashboard UI.

**Already done:** UserAIBalance and UserAIUsage models, free credits on registration (10 images + 5 text).

---

## Task 1: Usage Service — `backend/app/services/usage.py`

- `deduct_credits(db, user_id, action_type, amount, api_cost, metadata)` — deducts from balance, creates usage record, all in one transaction
- `get_balance(db, user_id) -> UserAIBalance` — returns or creates balance row
- `get_usage_history(db, user_id, limit, offset)` — paginated usage records

## Task 2: Balance Check Dependency — `backend/app/api/deps.py`

Add `require_credits(action_type, amount)` — FastAPI dependency that checks balance before endpoint execution.

## Task 3: Usage API — `backend/app/api/usage.py`

- `GET /api/usage/balance` — current balance
- `GET /api/usage/history` — paginated usage records
- `GET /api/usage/summary` — monthly summary (total images, total text, total cost)

## Task 4: Usage Dashboard UI

Update Dashboard page to show real balance data from API, and add a usage history table.

## Task 5: Tests
