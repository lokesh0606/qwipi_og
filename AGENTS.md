# AGENTS.md — Qwipi AI Development & Operational Manifesto

> **Scope**: Root-level guidance and architectural invariants for AI agents and human developers operating within the `qwipi` repository.  
> **Source of Truth**: This document represents the canonical guide for system persona, repository topography, data contracts, security boundaries, and operational runbooks.

---

## 1. System Overview & Architecture

**Qwipi** is a multi-tenant, streaming-first artificial intelligence workspace. It provides ultra-low latency LLM interactions, per-user conversational persistence, stateful session caching, dynamic runtime model selection, and customizable enterprise branding.

### Architectural Archetype: Monolithic Split
The codebase is structured as a decoupled full-stack monorepo:

```
                  ┌─────────────────────────────────────────┐
                  │          React 19 Single Page App       │
                  │   Vite + Tailwind CSS v4 + Three.js     │
                  │              (Port 5173)                │
                  └────────────────────┬────────────────────┘
                                       │ HTTP / REST & SSE Stream
                                       │ Authorization: Bearer <JWT>
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         FastAPI Asynchronous API        │
                  │       Uvicorn ASGI (Python 3.11+)       │
                  │              (Port 8000)                │
                  └────────────┬──────────────┬─────────────┘
                               │              │
        Asyncpg / SQLAlchemy   │              │ Redis async client
                               ▼              ▼
     ┌───────────────────────────┐  ┌───────────────────────────┐
     │   PostgreSQL 17 Database  │  │   Redis 8 In-Memory Store │
     │  Users, Chats, Messages,  │  │   JWT Blacklist, Caching, │
     │   Settings, System Config │  │    SlowAPI Rate Limiting  │
     │        (Port 5432)        │  │        (Port 6379)        │
     └───────────────────────────┘  └───────────────────────────┘
                               │
                               │ Groq Async OpenAI Client (LPU)
                               ▼
     ┌──────────────────────────────────────────────────────────┐
     │                     Groq Cloud API                       │
     │        GPT-OSS 120B / GPT-OSS 20B / Qwen 3.8 27B         │
     └──────────────────────────────────────────────────────────┘
```

### Core Technology Stack

| Layer | Component | Specification | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + React DOM | `19.2.0` | Declarative UI, Concurrent rendering, Client-side routing |
| **Frontend Tooling** | Vite (`rolldown-vite`) | `7.2.5` | Fast HMR dev server, chunk optimization |
| **Language (Client)** | TypeScript | `~5.9.3` | Strict type safety, interfaces in `frontend/src/types/index.ts` |
| **Styling** | Tailwind CSS v4 | `4.1.17` | Theme styling via `@tailwindcss/vite` |
| **3D Ambient Graphics**| Three.js + R3F + Drei | `three: 0.181`, `@react-three/fiber: 9.4` | Particle background canvas & wireframe icosahedrons (`Scene.tsx`) |
| **UI Animations** | Framer Motion | `12.23.24` | Component transitions, glow lighting effects (`GlowAnimation.tsx`) |
| **Markdown Parser** | React Markdown + Remark GFM| `react-markdown: 10.1`, `remark-gfm: 4.0` | GitHub-flavored markdown streaming, syntax highlighting |
| **Backend Framework** | FastAPI | `0.141.1` (Starlette `1.6.0`) | High-performance ASGI REST & streaming endpoints (`backend/api.py`) |
| **ASGI Web Server** | Uvicorn / Gunicorn | `uvicorn: 0.52`, `gunicorn: 26.2` | Production ASGI worker handling |
| **Data Validation** | Pydantic v2 | `2.13.5` (`pydantic-core: 2.46.5`)| Request/Response schema validation (`backend/schemas.py`) |
| **ORM / Data Access** | SQLAlchemy (Async) | `2.0.52` | Declarative async models & pooled sessions (`backend/database.py`) |
| **Database Drivers** | `asyncpg` + `psycopg2` | `asyncpg: 0.31`, `psycopg2-binary: 2.9` | `asyncpg` for FastAPI runtime; `psycopg2` for Alembic migrations |
| **Database Migrations**| Alembic | `1.19.2` | Versioned schema migration management (`backend/migrations/`) |
| **Authentication** | Bcrypt + JWT | `bcrypt: 5.0`, `python-jose: 3.5` | Password hashing, HS256 JWT tokens with 60-min TTL (`backend/auth.py`) |
| **Rate Limiting** | SlowAPI | `0.1.10` (Limits `5.8.0`) | Sliding window IP rate limiting backed by Redis |
| **Cache & Revocation**| Redis (Async) | `redis: 8.1.0` | JWT token blacklist on logout, branding cache (`backend/redis_client.py`) |
| **LLM Inference Engine**| Groq LPU Engine | OpenAI SDK `3.8.0` | Ultra-fast GPT-OSS 120B, 20B & Qwen 3.8 27B streaming (`backend/chat.py`) |
| **Primary Database** | PostgreSQL | `17-alpine` | Relational storage for users, conversations, messages, settings |

---

## 2. Repository Topography & Navigation Map

```text
qwipi/
├── .agents/                               # Antigravity Workspace Customizations
│   └── skills/                            # On-demand progressive disclosure skills
│       ├── qwipi-navigation/SKILL.md      # Navigation & blast-radius checking
│       ├── qwipi-verification/SKILL.md    # Verification runbooks & health checks
│       └── qwipi-chat-streaming/SKILL.md  # Streaming mechanics & contract sync
├── AGENTS.md                              # This file: Agent manifesto & rules of engagement
├── SKILLS.md                              # Operational runbook catalog for developer/agent tasks
├── README.md                              # High-level repository overview
├── docker-compose.yml                     # 4-tier stack orchestration (db, redis, api, frontend)
├── .env.example                           # Sanitized environment template
│
├── backend/                               # FastAPI Application Core
│   ├── api.py                             # Central monolith: Routing, middleware, multi-turn stream
│   ├── auth.py                            # Authentication logic, password hashing, JWT blacklisting
│   ├── chat.py                            # LLM provider factory, Groq engine, multi-turn formatting
│   ├── cli.py                             # Administrative CLI (user promotion, password resets)
│   ├── database.py                        # Async SQLAlchemy engine & session dependency
│   ├── models.py                          # Declarative ORM models (User, Conversation, Message, etc.)
│   ├── schemas.py                         # Pydantic v2 validation & response schemas
│   ├── redis_client.py                    # Async Redis connection pool & lifecycle management
│   ├── verify_servers.py                  # Full-stack diagnostic and verification test script
│   ├── alembic.ini                        # Alembic database migration config
│   ├── requirements.txt                   # Python package dependencies
│   ├── Dockerfile                         # Python backend container build
│   └── migrations/                        # Alembic migration scripts
│
├── frontend/                              # React 19 SPA (Vite + TypeScript)
│   ├── package.json                       # NPM dependencies and scripts
│   ├── vite.config.ts                     # Vite build configuration and plugins
│   ├── tailwind.config.js                 # Tailwind CSS styling configuration
│   ├── index.html                         # SPA entry HTML
│   └── src/
│       ├── main.tsx                       # React application bootstrap & providers
│       ├── App.tsx                        # Client-side router & route protection
│       ├── index.css                      # Global styles and Tailwind directives
│       ├── config/
│       │   └── api.ts                     # Centralized API_BASE_URL resolution
│       ├── types/
│       │   └── index.ts                   # TypeScript interfaces (Message, Conversation, User)
│       ├── hooks/
│       │   └── useChatStream.ts           # Central multi-turn chat streaming custom hook
│       ├── contexts/
│       │   ├── AuthContext.tsx            # User authentication state & token management
│       │   ├── SettingsContext.tsx        # User preferences (theme, model, provider, glow)
│       │   └── BrandingContext.tsx        # Dynamic app name & system branding state
│       └── components/
│           ├── ChatInterface.tsx          # Main chat container & view orchestration
│           ├── MessageBubble.tsx          # Markdown message bubble with syntax highlighting
│           ├── Sidebar.tsx                # Conversation history sidebar & user profile
│           ├── SettingsModal.tsx          # Preferences & model selection modal
│           ├── AdminDashboard.tsx         # Admin management panel
│           ├── ProtectedRoute.tsx         # Route guard for authenticated users
│           ├── AdminRoute.tsx             # Route guard for admin-only pages
│           ├── Scene.tsx                  # 3D Three.js particle canvas
│           ├── GlowAnimation.tsx          # Dynamic morphing backdrop glow
│           └── chat/
│               ├── ChatHeader.tsx         # Header bar with active model & status
│               ├── ChatInput.tsx          # Message input textarea with auto-resize
│               └── MessageList.tsx        # Auto-scrolling list of conversation messages
```

---

## 3. Environment Variables & Setup

### Configuration Hierarchy
All credentials and runtime parameters are managed via environment variables. An example template is provided in [.env.example](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/.env.example).

| Variable | Default / Example | Required | Purpose |
| :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | `gsk_...` | **YES** | Authentication key for Groq Cloud LLM inference |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:pass@localhost:5432/qwipi_db` | **YES** | SQLAlchemy async connection string for PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379/0` | **YES** | Redis URL for token blacklisting, caching, and rate limiting |
| `SECRET_KEY` | *(Strong random string)* | **YES** | Cryptographic key for signing HS256 JWT tokens |
| `ALGORITHM` | `HS256` | NO | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | NO | JWT token expiration lifespan (minutes) |
| `FIRST_SUPERUSER_EMAIL` | `admin@example.com` | NO | Email auto-promoted to admin on signup or server startup |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | NO | CORS allowed frontend origins (comma-separated) |
| `VITE_API_BASE_URL` | `http://localhost:8000` | NO | Frontend target URL for backend API requests |

### Development Runbooks

#### Option A: Docker Compose (Full-Stack Automated)
Run all 4 tiers (PostgreSQL 17, Redis Alpine, FastAPI backend, Vite frontend) simultaneously:
```bash
docker compose up -d --build
```
- API available at: `http://localhost:8000`
- Frontend available at: `http://localhost:5173`
- PostgreSQL at: `localhost:5432`
- Redis at: `localhost:6379`

#### Option B: Bare-Metal Local Development
1. **Ensure Database & Cache are Running**:
   ```bash
   docker compose up -d db redis
   ```
2. **Backend Setup**:
   ```bash
   # From repository root or backend directory
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   pip install -r backend/requirements.txt
   uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload
   ```
3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

#### Option C: Full Diagnostic Verification
Verify that databases, servers, public endpoints, authentication, and Groq streaming are operational:
```bash
python backend/verify_servers.py
```

---

## 4. Cross-Stack Contracts & Data Synchronization

When modifying data models or interfaces, changes **must** be synchronized across all three tiers:

### 1. Model Mapping Matrix

| SQLAlchemy ORM Model (`backend/models.py`) | Pydantic Schema (`backend/schemas.py`) | TypeScript Interface (`frontend/src/types/index.ts`) | Notes |
| :--- | :--- | :--- | :--- |
| `User` | `UserResponse`, `UserCreate`, `UserLogin` | `User` | `is_admin` defaults to `False`. Passwords never returned in response. |
| `Conversation` | `ConversationResponse`, `ConversationDetail` | `Conversation`, `ConversationDetail` | UUID converted to `str` before serialization. `updated_at` drives sorting. |
| `Message` | `MessageResponse`, `MessageCreate` | `Message` | Role must be `'user' \| 'assistant' \| 'system'`. Content is UTF-8 markdown text. |
| `Settings` | `SettingsResponse`, `SettingsUpdate` | Managed in `SettingsContext.tsx` | Defaults: provider `'groq'`, model `'openai/gpt-oss-120b'`, theme `'dark'`. |
| `SystemConfig` | `SystemConfigResponse`, `AppConfig` | Managed in `BrandingContext.tsx` | Key-value store for app-wide branding. Cached in Redis. |

### 2. Synchronization Invariants
- **UUID String Conversion**: SQLAlchemy models use PostgreSQL `UUID(as_uuid=True)`. Pydantic response schemas MUST define a `convert_uuid_to_str` validator mode `'before'` to convert native UUID objects to strings.
- **Timestamp ISO Formatting**: All timestamps (`created_at`, `updated_at`) are handled in UTC and serialized to ISO-8601 strings.

---

## 5. Architectural Invariants & Security Protocols

### Invariant 1: Multi-Tenant Data Isolation (CRITICAL)
Every database query in [backend/api.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/api.py) touching conversations, messages, or user settings **MUST** be explicitly scoped to `current_user.id`.
```python
# CORRECT:
select(Conversation).where(
    and_(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    )
)

# FORBIDDEN (SECURITY VULNERABILITY):
select(Conversation).where(Conversation.id == conversation_id)
```

### Invariant 2: Raw Text Chunk Streaming Protocol
The `/chat` endpoint returns a FastAPI `StreamingResponse(generate(), media_type="text/plain")` with header `X-Conversation-Id: <id>`.
- The generator yields **raw text chunks** as they arrive from the Groq API.
- The frontend hook [useChatStream.ts](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/hooks/useChatStream.ts) decodes incoming chunks using a native `TextDecoder`.
- **DO NOT** wrap tokens in JSON envelopes (e.g., `{"token": "..."}`) unless simultaneously rewriting `useChatStream.ts`.
- The assistant message is committed to PostgreSQL in the generator's `finally` block to preserve responses even if the client disconnects prematurely.

### Invariant 3: Authentication & Token Blacklisting
- Passwords are encrypted using `bcrypt` with salt rounds. Bcrypt imposes a hard limit of 72 bytes; [schemas.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/schemas.py) strictly validates password byte length.
- Tokens are HS256 JWTs with a unique JWT ID (`jti`) and 60-minute expiration.
- Logging out (`POST /auth/logout`) extracts `jti` and writes it to Redis under `blacklist:<jti>` with a TTL matching remaining lifespan.
- If Redis is temporarily unreachable, `is_token_blacklisted` fails open gracefully with a warning to avoid total system lockouts.

### Invariant 4: Administrative Elevation & CLI
Administrator status (`is_admin=True`) grants access to `/api/v1/admin/*` and the frontend `/admin` dashboard.
Admins can be managed via [backend/cli.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/cli.py):
```bash
# List all registered users
python -m backend.cli list-users

# Promote user to administrator
python -m backend.cli promote-admin <email>

# Demote administrator
python -m backend.cli demote-admin <email>

# Reset user password
python -m backend.cli set-password <email> <new_password>
```

---

## 6. Pre-Flight Protocol for AI Agents

Before applying changes to this codebase, execute the following pre-flight checklist:

1. **Check Blast Radius**:
   - Modifying `backend/models.py`? -> Create an Alembic migration (`alembic revision --autogenerate`) and update `backend/schemas.py` and `frontend/src/types/index.ts`.
   - Modifying `backend/api.py` routes? -> Update corresponding API calls in `frontend/src/` and check auth dependencies.
   - Modifying `frontend/src/hooks/useChatStream.ts`? -> Test against `POST /chat` streaming response and `X-Conversation-Id` header handling.
2. **Preserve Comments & Docstrings**:
   - Retain all existing docstrings, type annotations, and structural comments.
3. **Execute Verification**:
   - Run `python -m py_compile` on modified backend files.
   - Run `npm run lint` or `npm run build` in `frontend/` to confirm type correctness.
   - Run `python backend/verify_servers.py` when live services are being tested.
