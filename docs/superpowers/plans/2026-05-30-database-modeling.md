# Database Modeling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Design MySQL schema for user system, AI usage tracking, and billing. Create SQLAlchemy models, Alembic migration, and seed data.

**Architecture:** All models live in `backend/app/models/`. Each table gets its own file. Models use SQLAlchemy 2.0 `Mapped` style with `DeclarativeBase`. UUIDs stored as `CHAR(36)`. MySQL JSON type for `user_ai_usage.metadata`. Timestamps use `DateTime(timezone=True)` with `func.now()` defaults.

**Tech Stack:** SQLAlchemy 2.0, Alembic, MySQL 8.0, Python uuid module

---

## Schema Design

### users
| Column | Type | Constraint | Note |
|--------|------|-----------|------|
| id | CHAR(36) | PK | uuid4 |
| phone | VARCHAR(20) | UNIQUE, nullable | Phone-registered users |
| password_hash | VARCHAR(255) | nullable | bcrypt hash |
| wechat_openid | VARCHAR(128) | UNIQUE, nullable | WeChat login |
| role | VARCHAR(20) | DEFAULT 'user' | 'admin' or 'user' |
| parent_user_id | CHAR(36) | FK→users.id, nullable | For sub-accounts |
| is_active | BOOLEAN | DEFAULT TRUE | Soft disable |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | ON UPDATE |

### user_sessions
| Column | Type | Constraint | Note |
|--------|------|-----------|------|
| id | CHAR(36) | PK | |
| user_id | CHAR(36) | FK→users.id, INDEX | |
| refresh_token | VARCHAR(512) | NOT NULL | JWT refresh token |
| expires_at | DATETIME | NOT NULL | |
| created_at | DATETIME | NOT NULL | |

### user_ai_balance
| Column | Type | Constraint | Note |
|--------|------|-----------|------|
| id | CHAR(36) | PK | |
| user_id | CHAR(36) | FK→users.id, UNIQUE | One balance row per user |
| image_credits | INT | DEFAULT 0 | Remaining image generations |
| text_credits | INT | DEFAULT 0 | Remaining text generations |
| updated_at | DATETIME | NOT NULL | |

### user_ai_usage
| Column | Type | Constraint | Note |
|--------|------|-----------|------|
| id | CHAR(36) | PK | |
| user_id | CHAR(36) | FK→users.id, INDEX | |
| action_type | VARCHAR(20) | INDEX | image_gen / text_gen / keyword / publish |
| credits_used | DECIMAL(10,4) | NOT NULL | |
| api_cost | DECIMAL(10,6) | DEFAULT 0 | Internal cost tracking |
| metadata | JSON | nullable | Related image_id, listing_id, etc. |
| created_at | DATETIME | INDEX | |

### recharge_orders
| Column | Type | Constraint | Note |
|--------|------|-----------|------|
| id | CHAR(36) | PK | |
| user_id | CHAR(36) | FK→users.id, INDEX | |
| order_no | VARCHAR(64) | UNIQUE | Generated order number |
| amount | DECIMAL(10,2) | NOT NULL | CNY |
| payment_method | VARCHAR(20) | nullable | alipay / wechat / bank_transfer |
| status | VARCHAR(20) | DEFAULT 'pending' | pending / paid / failed / refunded |
| package_type | VARCHAR(20) | NOT NULL | basic / professional / custom |
| image_credits | INT | DEFAULT 0 | Credits granted |
| text_credits | INT | DEFAULT 0 | Credits granted |
| paid_at | DATETIME | nullable | |
| created_at | DATETIME | NOT NULL | |

---

### Task 1: Create SQLAlchemy Models

**Files to create:**
- `backend/app/models/user.py`
- `backend/app/models/user_session.py`
- `backend/app/models/user_ai_balance.py`
- `backend/app/models/user_ai_usage.py`
- `backend/app/models/recharge_order.py`

**File to update:**
- `backend/app/models/__init__.py` — import all models so Alembic discovers them

### Task 2: Generate & Run Alembic Migration

Run `alembic revision --autogenerate -m "create core tables"` then `alembic upgrade head`.

### Task 3: Create Seed Script

Create `backend/app/seed.py` — creates a test user with 10 image + 5 text credits (matching PRD free tier).

### Task 4: Write Model Tests

Test model instantiation, relationships, and constraints.

### Task 5: Redis Session Cache Configuration

Create `backend/app/core/redis.py` — Redis client wrapper for session caching.
