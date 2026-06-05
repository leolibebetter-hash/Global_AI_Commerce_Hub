# Phase 2: Copy Factory — Implementation Plan

> **Goal:** DeepSeek generates Listing (title + 5 bullets + description) + keyword recommendations. Skill abstraction ready for future plug-in providers.

**Architecture principle:** Each copy generation unit is a skill implementing a common interface. DeepSeek is the first implementation. Adding a new provider (LinkFX, Jasper, etc.) = one new file + one config change.

---

## Sub-Phase 2.1: Skill Abstraction Layer

**`backend/app/services/copy_skills/`** — new directory

### `base.py` — Abstract skill interfaces
```python
class TitleSkill(ABC):
    """Generates Amazon listing title (≤200 chars, includes main keyword)."""
    async def generate(ctx: ProductContext) -> TitleResult

class BulletSkill(ABC):
    """Generates 5 bullet points with long-tail keywords."""
    async def generate(ctx: ProductContext) -> BulletResult

class DescriptionSkill(ABC):
    """Generates product description (250-2000 words, HTML)."""
    async def generate(ctx: ProductContext) -> DescriptionResult

class KeywordSkill(ABC):
    """Recommends 20-30 keywords with search volume + competition."""
    async def recommend(ctx: ProductContext) -> KeywordResult
```

### `registry.py` — Skill registry
```python
def get_title_skill(provider: str = "deepseek") -> TitleSkill
def get_bullet_skill(provider: str = "deepseek") -> BulletSkill  
def get_description_skill(provider: str = "deepseek") -> DescriptionSkill
def get_keyword_skill(provider: str = "deepseek") -> KeywordSkill
def list_available_skills() -> dict
```

### `deepseek_title.py`, `deepseek_bullet.py`, `deepseek_description.py`, `deepseek_keyword.py`

Each implements the corresponding interface using DeepSeek API (reusing `services/deepseek.py` client). Each has its own system prompt tuned for that specific task.

### `mock_keyword.py` — Mock keyword skill (static keyword list, no API cost)

## Sub-Phase 2.2: Product Context Schema

**`backend/app/schemas/product.py`** — `ProductContext`
- product_name: str
- category: str
- features: list[str]
- target_market: str (default "US")
- language: str (default "en")
- keywords: list[str] | None (optional, manual override)

## Sub-Phase 2.3: Copy Factory API

**`backend/app/api/copy_factory.py`**

- `POST /api/copy-factory/generate-all` — runs title + bullets + description in parallel, returns structured result
- `POST /api/copy-factory/generate-title` — single title generation
- `POST /api/copy-factory/generate-bullets` — single bullets generation
- `POST /api/copy-factory/generate-description` — single description generation
- `GET /api/copy-factory/skills` — list available copy skills
- `POST /api/copy-factory/keywords` — get keyword recommendations
- `POST /api/copy-factory/optimize` — re-target specific keywords to adjust density
- `POST /api/copy-factory/confirm` — confirm usage, deduct text credits

Each endpoint accepts `provider` param (default "deepseek") for future plug-in selection.

## Sub-Phase 2.4: Copy Factory UI

**`frontend/src/pages/CopyFactory.tsx`**

- Product info form (name, category, features as tags, target market dropdown)
- "Generate All" button → parallel generation with progress indicators
- Tabbed result panels: Title | Bullets | Description | Keywords
- Each panel: edit inline, regenerate individually
- Bilingual preview toggle (中文/English) — DeepSeek generates both
- Keywords panel: table with search volume bars + competition badges + "implanted" checkmarks
- Content score card: keyword density %, char count, readability
- "Optimize" button for density tuning
- Confirm → deduct text credits

## Sub-Phase 2.5: Tests + Commit
