# Project Scaffolding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the monorepo with FastAPI backend + React frontend, configured for TDD from day one.

**Architecture:** Two independent applications in a monorepo. Backend is FastAPI (Python 3.11, async) exposing REST APIs. Frontend is React 18 + TypeScript + Vite + Tailwind CSS consuming those APIs. MySQL 8.0 and Redis 7 run directly on the host machine — no containerization. No shared code between frontend/backend — they communicate only via HTTP.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PyMySQL, MySQL 8.0, Redis 7, React 18, TypeScript 5, Vite, Tailwind CSS 3, react-i18next

---

## File Structure

```
Global_AI_Commerce_Hub/
├── .gitignore
├── .env.example
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   └── __init__.py
│   │   ├── schemas/
│   │   │   └── __init__.py
│   │   ├── api/
│   │   │   └── __init__.py
│   │   └── services/
│   │       └── __init__.py
│   └── tests/
│       ├── __init__.py
│       └── conftest.py
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── components/
│       │   └── .gitkeep
│       ├── pages/
│       │   └── .gitkeep
│       ├── hooks/
│       │   └── .gitkeep
│       ├── i18n/
│       │   ├── index.ts
│       │   ├── zh.json
│       │   └── en.json
│       └── lib/
│           └── .gitkeep
└── docs/
    └── (existing PRD files)
```

---

### Task 1: Initialize Git Repository

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

```bash
git init
```

Create `.gitignore`:

```gitignore
# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
.venv/
venv/
*.egg

# Node
node_modules/
frontend/dist/

# Env
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

- [ ] **Step 2: Create .env.example at root**

```
# DeepSeek API
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Database
MYSQL_USER=root
MYSQL_PASSWORD=change-me-in-production
MYSQL_DB=global_ai_commerce_hub
MYSQL_HOST=localhost
MYSQL_PORT=3306

# Redis
REDIS_URL=redis://localhost:6379/0

# AWS S3 (Phase 1)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=your-bucket
AWS_REGION=ap-southeast-1

# JWT
JWT_SECRET_KEY=change-me
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

- [ ] **Step 3: Initial commit**

```bash
git add .gitignore .env.example
git commit -m "chore: initialize repository with gitignore and env template"
```

---

### Task 2: Scaffold FastAPI Backend

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/services/__init__.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy==2.0.36
alembic==1.14.0
pymysql==1.1.1
cryptography==44.0.0
pydantic==2.10.3
pydantic-settings==2.7.0
redis==5.2.1
celery==5.4.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.18
httpx==0.28.1
openai==1.58.1

# Dev
pytest==8.3.4
pytest-asyncio==0.24.0
httpx==0.28.1
```

- [ ] **Step 2: Create app/__init__.py**

Empty file.

- [ ] **Step 3: Create app/core/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    # DeepSeek
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"

    # Database
    mysql_user: str = "root"
    mysql_password: str = "change-me-in-production"
    mysql_db: str = "global_ai_commerce_hub"
    mysql_host: str = "localhost"
    mysql_port: int = 3306

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_db}"
            f"?charset=utf8mb4"
        )

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30


settings = Settings()
```

- [ ] **Step 4: Create app/core/database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, pool_size=10, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 5: Create app/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Global AI Commerce Hub",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
```

- [ ] **Step 6: Create empty __init__.py files**

Create empty files at:
- `backend/app/models/__init__.py`
- `backend/app/schemas/__init__.py`
- `backend/app/api/__init__.py`
- `backend/app/services/__init__.py`

- [ ] **Step 7: Create backend .env.example**

Copied root .env.example patterns, backend-specific:

```
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
MYSQL_USER=root
MYSQL_PASSWORD=change-me-in-production
MYSQL_DB=global_ai_commerce_hub
MYSQL_HOST=localhost
MYSQL_PORT=3306
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=change-me
```

- [ ] **Step 8: Create test infrastructure**

`backend/tests/__init__.py` — empty file.

`backend/tests/conftest.py`:

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 9: Write and run a smoke test**

`backend/tests/test_health.py`:

```python
def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

Run:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pytest tests/test_health.py -v
```

Expected: 1 test PASS

- [ ] **Step 10: Commit**

```bash
git add backend/
git commit -m "feat: scaffold FastAPI backend with config, database, health endpoint and test infra"
```

---

### Task 3: Scaffold React Frontend

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/vite-env.d.ts`
- Create: `frontend/src/i18n/index.ts`
- Create: `frontend/src/i18n/zh.json`
- Create: `frontend/src/i18n/en.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "global-ai-commerce-hub",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "i18next": "^24.0.5",
    "react-i18next": "^15.1.3"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.15.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "~5.6.2",
    "vite": "^6.0.1"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 3: Create tsconfig.app.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 6: Create tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 7: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 8: Create index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Global AI Commerce Hub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Create src/main.tsx**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 10: Create src/App.tsx**

```typescript
import { useTranslation } from "react-i18next";

function App() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("app.title")}
        </h1>
        <p className="mt-4 text-gray-600">{t("app.welcome")}</p>
        <button
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() =>
            i18n.changeLanguage(i18n.language === "zh" ? "en" : "zh")
          }
        >
          {t("app.switch_lang")}
        </button>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 11: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 12: Create src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 13: Create i18n setup**

`src/i18n/index.ts`:

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zh from "./zh.json";
import en from "./en.json";

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: "zh",
  fallbackLng: "zh",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

`src/i18n/zh.json`:

```json
{
  "app": {
    "title": "Global AI Commerce Hub",
    "welcome": "AI 驱动的跨境电商上架内容工厂",
    "switch_lang": "Switch to English"
  }
}
```

`src/i18n/en.json`:

```json
{
  "app": {
    "title": "Global AI Commerce Hub",
    "welcome": "AI-Powered Cross-Border Listing Content Factory",
    "switch_lang": "切换到中文"
  }
}
```

- [ ] **Step 14: Create .gitkeep files for empty directories**

```bash
touch frontend/src/components/.gitkeep
touch frontend/src/pages/.gitkeep
touch frontend/src/hooks/.gitkeep
touch frontend/src/lib/.gitkeep
```

- [ ] **Step 15: Install dependencies and verify**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — verify the title, welcome message, and language toggle button work.

- [ ] **Step 16: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold React frontend with TypeScript, Tailwind, i18n, Vite proxy"
```

---

### Task 4: Linting Configuration

**Files:**
- Create: `backend/pyproject.toml` (Ruff config)
- Create: `frontend/eslint.config.js`

- [ ] **Step 1: Add Ruff config**

`backend/pyproject.toml`:

```toml
[tool.ruff]
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

- [ ] **Step 2: Add ESLint config**

`frontend/eslint.config.js`:

```javascript
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
  }
);
```

- [ ] **Step 3: Install ESLint deps**

```bash
cd frontend
npm install -D eslint @eslint/js typescript-eslint
```

- [ ] **Step 4: Run linters**

```bash
cd backend
pip install ruff
ruff check app/

cd ../frontend
npx eslint src/
```

Expected: No errors on scaffolded code.

- [ ] **Step 5: Commit**

```bash
git add backend/pyproject.toml frontend/eslint.config.js frontend/package.json frontend/package-lock.json
git commit -m "chore: add linting config (Ruff for Python, ESLint for TypeScript)"
```

---

### Task 5: Alembic Database Migrations Setup

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/script.py.mako`

- [ ] **Step 1: Initialize Alembic**

```bash
cd backend
alembic init alembic
```

- [ ] **Step 2: Update alembic/env.py**

Replace the generated `env.py` with one that imports our SQLAlchemy `Base` and reads config from our settings:

```python
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

from app.core.config import settings
from app.core.database import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Create initial migration**

```bash
cd backend
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

- [ ] **Step 4: Commit**

```bash
git add backend/alembic.ini backend/alembic/
git commit -m "feat: add Alembic database migration setup"
```

---

## Self-Review

1. **Spec coverage:** All Task 0.1 subtasks (0.1.1–0.1.7) are covered.
2. **Placeholder scan:** No TBD/TODO — all code is concrete, all file paths are exact.
3. **Type consistency:** Frontend uses `i18n` → `index.ts` with `zh.json`/`en.json`, backend uses `app.core.config.settings` consistently.

Gaps intentionally left for later tasks:
- User models (Task 0.2 — Database Modeling)
- Auth endpoints (Task 0.3)
- Payment integration (Task 0.4)
- Celery setup (deferred to Phase 1 when image generation needs it)
- Design system selection (Task 0.6 via `ui-ux-pro-max`)
