# AI Capabilities & Model Reference

## Text Generation (Real AI)

| Item | Detail |
|------|--------|
| **Model** | `deepseek-chat` (DeepSeek) |
| **Protocol** | OpenAI SDK compatible |
| **Endpoint** | `https://api.deepseek.com` (configurable via `DEEPSEEK_BASE_URL`) |
| **Max Tokens** | Varies by use case (256–2048) |
| **Temperature** | 0.7 (balanced creativity) |
| **Cost** | ~$0.28/M input tokens, ~$1.10/M output tokens |

### Modules Using DeepSeek Text AI

| Module | Endpoint | Tokens | Credits | Est. API Cost |
|--------|----------|--------|---------|---------------|
| Copy Factory: Title | `/api/copy-factory/generate-title` | 256 | 1.0 | ~$0.004 |
| Copy Factory: Bullets | `/api/copy-factory/generate-bullets` | 256 | 1.0 | ~$0.004 |
| Copy Factory: Description | `/api/copy-factory/generate-description` | 256 | 1.0 | ~$0.004 |
| Copy Factory: Keywords | `/api/copy-factory/keywords` | 2048 | 1.0 | ~$0.004 |
| Marketing: Campaign | `/api/marketing/generate-campaign` | 1024 | 2.0 | ~$0.008 |
| Marketing: Script | `/api/marketing/generate-script` | 1024 | 1.0 | ~$0.004 |
| Marketing: Post | `/api/marketing/generate-post` | 800 | 0.5 | ~$0.002 |
| Marketing: Ad Copy | `/api/marketing/generate-ad-copy` | 800 | 1.0 | ~$0.004 |
| Marketing: Audience | `/api/marketing/audience-profile` | 800 | 1.5 | ~$0.006 |
| Research: Trending | `/api/market-research/analyze-trending` | 1200 | 2.0 | ~$0.008 |
| Research: Keywords | `/api/market-research/analyze-keywords` | 1000 | 1.5 | ~$0.006 |
| Research: Competitors | `/api/market-research/analyze-competitors` | 1200 | 2.0 | ~$0.008 |
| Product Planner | `/api/product-planner/generate` | 800 | 1.5 | ~$0.006 |

### AI Skill Implementation Pattern

Each text generation use case follows the same pattern:

```python
from app.services.deepseek import chat

system = "You are a [role]..."
prompt = f"Product: {ctx.product_name}\n..."
result = chat(prompt, system, max_tokens=1024)
# Parse JSON from result
```

The `chat()` function wraps the OpenAI SDK:

```python
# backend/app/services/deepseek.py
from openai import OpenAI

def chat(prompt: str, system: str, max_tokens: int = 256) -> str:
    client = OpenAI(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
    )
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        max_tokens=max_tokens,
        temperature=0.7,
    )
    return response.choices[0].message.content or ""
```

### Multi-Market Localization

Copy Factory uses market-specific hints injected into the system prompt:

| Market | Localization Strategy |
|--------|----------------------|
| US | Benefit-driven, direct value propositions |
| UK | Understated quality, proper British spelling |
| DE | Technical precision, certifications, detailed specs |
| JP | Politeness, trust signals, detailed feature lists |
| FR | Elegance, brand heritage, quality craftsmanship |
| CA | Practicality, bilingual awareness |
| AU | Authenticity, durability, outdoor lifestyle |

---

## Image Generation (Mock — Ready for Real API)

| Item | Detail |
|------|--------|
| **Current** | `MockSceneGenerator` — generates solid-color placeholder images |
| **Planned** | `ReplicateSceneGenerator` — code scaffold ready, needs API key |
| **Config** | `SCENE_GENERATOR=replicate` in `.env` |
| **Recommended API** | Replicate (Flux Pro / Stable Diffusion) or OpenAI DALL·E |

### Image Generation Flow

```
Upload Image → Background Removal → Scene Generation (×3 styles) → Download/Use
```

### Supported Styles (style prompts ready)

| Style | Prompt |
|-------|--------|
| Minimal | clean white background, studio lighting, minimalist product photography, no shadows |
| Lifestyle | natural home setting, warm ambient lighting, cozy lifestyle scene, depth of field |
| Premium | luxury dark backdrop, dramatic lighting, high-end commercial photography, reflective surface |
| Dark | (pending prompt) |
| Nature | (pending prompt) |
| Urban | (pending prompt) |
| Vintage | (pending prompt) |
| Neon | (pending prompt) |

The `SceneGenerator` ABC defines the interface:

```python
class SceneGenerator(ABC):
    @abstractmethod
    async def generate(self, image_url: str, style: str, count: int = 3) -> list[str]:
        """Generate scene images. Returns list of URLs."""
```

To connect Replicate, implement:

```python
class ReplicateSceneGenerator(SceneGenerator):
    async def generate(self, image_url: str, style: str, count: int = 3) -> list[str]:
        import replicate
        prompt = STYLE_PROMPTS.get(style, STYLE_PROMPTS["minimal"])
        # Call Replicate API with product image + style prompt
```

---

## Credit System

### Credit Types

| Type | Used For | DB Field |
|------|----------|----------|
| image_credits | Image generation & processing | `user_ai_balance.image_credits` |
| text_credits | All text AI (copy, marketing, research, planning) | `user_ai_balance.text_credits` |

### New User Trial

- 10 image credits
- 5 text credits

### Pricing Packages (Suggested)

| Package | Price | Image Credits | Text Credits |
|---------|-------|---------------|--------------|
| Free | $0 | 10 | 5 |
| Starter | $19/mo | 50 | 30 |
| Growth | $49/mo | 150 | 100 |
| Pro | $129/mo | 500 | 300 |
| Enterprise | Custom | Unlimited | Unlimited |
