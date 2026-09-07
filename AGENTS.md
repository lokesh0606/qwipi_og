# AGENTS.md — Qwipi AI Development & Operational Manifesto

> **Scope**: Canonical root-level specification, architectural invariants, cross-stack data contracts, and operational protocols for AI coding agents and human developers operating within the `qwipi` repository.  
> **Frontier Standard**: Adheres to the open `AGENTS.md` specification adopted across OpenAI Codex, Anthropic Claude Code, Cursor, and Google Antigravity.

---

## 1. System Overview & Architecture

**Qwipi** is a multi-tenant, streaming-first artificial intelligence workspace. It delivers ultra-low latency LLM interactions, per-user conversational persistence, stateful session caching, dynamic runtime model selection, and customizable branding.

### Architectural Archetype: Monolithic Split
The codebase is structured as a decoupled full-stack monorepo:

```
                  ┌─────────────────────────────────────────┐
                  │          React 19 Single Page App       │
                  │   Vite + Tailwind CSS v4 + Three.js     │
                  │              (Port 5173)                │
                  └────────────────────┬────────────────────┘
                                       │ HTTP / REST & Raw Chunk Stream
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
     │        GPT-OSS 120B / GPT-OSS 20B / Qwen 2.5 Coder 32B   │
     └──────────────────────────────────────────────────────────┘
```

### Core Technology Stack

| Layer | Component | Version / Specification | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + React DOM | `19.2.0` | Declarative UI, Concurrent rendering, Client-side routing |
| **Frontend Tooling** | Vite (`rolldown-vite`) | `7.2.5` | Fast HMR dev server, chunk optimization |
| **Language (Client)** | TypeScript | `~5.9.3` | Strict static typing (`frontend/src/types/index.ts`) |
| **Styling** | Tailwind CSS v4 | `4.1.17` | Utility-first theme styling via `@tailwindcss/vite` |
| **3D Ambient Graphics**| Three.js + R3F + Drei | `three: 0.181`, `@react-three/fiber: 9.4` | Particle background canvas (`Scene.tsx`) |
| **UI Motion** | Framer Motion | `12.23.24` | Component transitions, glow lighting effects (`GlowAnimation.tsx`) |
| **Markdown Parser** | React Markdown + Remark GFM | `react-markdown: 10.1`, `remark-gfm: 4.0` | GitHub-flavored markdown streaming, syntax highlighting |
| **Backend Framework** | FastAPI | `0.141.1` (Starlette `1.6.0`) | High-performance ASGI REST & streaming endpoints (`backend/api.py`) |
| **ASGI Web Server** | Uvicorn / Gunicorn | `uvicorn: 0.52`, `gunicorn: 26.2` | Production ASGI worker handling |
| **Data Validation** | Pydantic v2 | `2.13.5` (`pydantic-core: 2.46.5`) | Request/Response schema validation (`backend/schemas.py`) |
| **ORM / Data Access** | SQLAlchemy (Async) | `2.0.52` | Declarative async models & pooled sessions (`backend/database.py`) |
| **Database Drivers** | `asyncpg` + `psycopg2` | `asyncpg: 0.31`, `psycopg2-binary: 2.9` | `asyncpg` for FastAPI runtime; `psycopg2` for Alembic migrations |
| **Database Migrations**| Alembic | `1.19.2` | Versioned schema migration management (`backend/migrations/`) |
| **Authentication** | Bcrypt + JWT | `bcrypt: 5.0`, `python-jose: 3.5` | Password hashing (<=72 bytes), HS256 JWT tokens with 60-min TTL |
| **Rate Limiting** | SlowAPI | `0.1.10` (Limits `5.8.0`) | Sliding window IP rate limiting backed by Redis |
| **Cache & Revocation**| Redis (Async) | `redis: 8.1.0` | JWT blacklist on logout, branding cache (`backend/redis_client.py`) |
| **LLM Inference Engine**| Groq LPU Engine | OpenAI SDK `3.8.0` | Ultra-fast streaming completions (`backend/chat.py`) |
| **Primary Database** | PostgreSQL | `17-alpine` | Relational storage for users, conversations, messages, settings |

---

## 2. Repository Topography & Key File Map

```text
qwipi/
├── .agents/                               # Antigravity & Agent Customizations
│   ├── rules/
│   │   └── living_manifesto.md            # Rule: Continuous documentation synchronization
│   └── skills/                            # On-demand progressive disclosure skills
│       ├── qwipi-chat-streaming/SKILL.md  # Multi-turn streaming & title adaptation mechanics
│       ├── qwipi-navigation/SKILL.md      # Navigation, blast-radius & cross-stack tracing
│       └── qwipi-verification/SKILL.md    # Static verification & diagnostic health checks
│
├── AGENTS.md                              # This file: Single source of truth for AI agents
├── SKILLS.md                              # Master Skills Catalog & Operational Runbooks
├── README.md                              # Project landing page & quickstart
├── docker-compose.yml                     # 4-tier stack orchestration (db, redis, api, frontend)
├── .env.example                           # Sanitized environment template
│
├── backend/                               # FastAPI Application Root
│   ├── api.py                             # Central monolith: Routing, middleware, multi-turn stream
│   ├── auth.py                            # Authentication, password hashing, JWT blacklisting
│   ├── chat.py                            # LLM provider factory, Groq engine, title streaming
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
└── frontend/                              # React 19 SPA (Vite + TypeScript)
    ├── package.json                       # NPM dependencies and scripts
    ├── vite.config.ts                     # Vite build configuration and plugins
    ├── tailwind.config.js                 # Tailwind CSS configuration
    ├── index.html                         # SPA entry HTML
    └── src/
        ├── main.tsx                       # React application bootstrap & providers
        ├── App.tsx                        # Client-side router & route protection
        ├── index.css                      # Global styles and Tailwind directives
        ├── config/
        │   └── api.ts                     # Centralized API_BASE_URL resolution
        ├── types/
        │   └── index.ts                   # TypeScript interfaces (Message, Conversation, User)
        ├── hooks/
        │   └── useChatStream.ts           # Central multi-turn chat streaming custom hook
        ├── contexts/
        │   ├── AuthContext.tsx            # User authentication state & token management
        │   ├── SettingsContext.tsx        # User preferences (theme, model, provider, glow)
        │   └── BrandingContext.tsx        # Dynamic app name & system branding state
        └── components/
            ├── ChatInterface.tsx          # Main chat container & view orchestration
            ├── MessageBubble.tsx          # Markdown message bubble with syntax highlighting
            ├── Sidebar.tsx                # Conversation history sidebar & user profile
            ├── SettingsModal.tsx          # Preferences & model selection modal
            ├── AdminDashboard.tsx         # Admin management panel
            ├── ProtectedRoute.tsx         # Route guard for authenticated users
            ├── AdminRoute.tsx             # Route guard for admin-only pages
            ├── Scene.tsx                  # 3D Three.js particle canvas
            ├── GlowAnimation.tsx          # Dynamic morphing backdrop glow
            └── chat/
                ├── ChatHeader.tsx         # Header bar with active model & status
                ├── ChatInput.tsx          # Message input textarea with auto-resize
                └── MessageList.tsx        # Auto-scrolling list of conversation messages
```

---

## 3. Essential Operational Commands

### Development Servers
```bash
# 1. Start Infrastructure (PostgreSQL 17 & Redis 8)
docker compose up -d db redis

# 2. Start Backend (Uvicorn with auto-reload)
uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload

# 3. Start Frontend (Vite HMR dev server)
cd frontend && npm run dev
```

### Build & Static Verification
```bash
# Verify Python syntax across all backend modules
python -m py_compile backend/api.py backend/chat.py backend/auth.py backend/models.py backend/schemas.py backend/database.py backend/redis_client.py backend/cli.py backend/verify_servers.py

# Verify TypeScript types and production bundle build
cd frontend && npm run build

# Run end-to-end full-stack diagnostics
python backend/verify_servers.py
```

### Database Migrations (Alembic)
```bash
# Generate new migration after modifying backend/models.py
alembic revision --autogenerate -m "description_of_change"

# Apply pending migrations to PostgreSQL
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

### Administrative CLI
```bash
# List all registered users
python -m backend.cli list-users

# Promote user to administrator
python -m backend.cli promote-admin user@example.com

# Demote administrator
python -m backend.cli demote-admin user@example.com

# Reset user password directly in PostgreSQL
python -m backend.cli set-password user@example.com NewSecurePassword123!
```

---

## 4. Cross-Stack Contracts & Data Synchronization

When modifying data models or interfaces, changes **must** be synchronized across all three tiers:

### 1. Model Mapping Matrix

| SQLAlchemy ORM Model (`backend/models.py`) | Pydantic Schema (`backend/schemas.py`) | TypeScript Interface (`frontend/src/types/index.ts`) | Synchronization Notes |
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

## 5. Architectural & Security Invariants

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

# FORBIDDEN (CRITICAL SECURITY VULNERABILITY):
select(Conversation).where(Conversation.id == conversation_id)
```

### Invariant 2: Raw Text Chunk Streaming & Display-Rate Token Scheduling
The `/chat` endpoint returns a FastAPI `StreamingResponse(generate(), media_type="text/plain")` with header `X-Conversation-Id: <id>`.
- The generator yields **raw UTF-8 string chunks** as they arrive from the Groq API.
- The frontend hook [useChatStream.ts](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/hooks/useChatStream.ts) decodes incoming chunks using `TextDecoder.decode(value, { stream: true })`.
- **Display Refresh-Rate Batching**: Incoming tokens are buffered and scheduled via `requestAnimationFrame` to synchronize React state updates with 60Hz/120Hz display refresh rate, eliminating layout thrashing and UI jitter.
- **Zero-Jitter Scroll Pinning**: In [MessageList.tsx](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/components/chat/MessageList.tsx), auto-scrolling uses direct DOM pinning (`container.scrollTop = container.scrollHeight`), eliminating animation abort-and-restart jitter. User scroll up is respected without forceful downward snapping.
- **MessageBubble Memoization**: [MessageBubble.tsx](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/components/MessageBubble.tsx) is wrapped in `React.memo` so historical messages are not re-parsed or re-rendered as new tokens arrive.
- **DO NOT** wrap tokens in JSON envelopes (e.g., `{"token": "..."}`) unless simultaneously rewriting `useChatStream.ts`.
- The assistant message is committed to PostgreSQL in the generator's `finally` block to preserve responses even if the client disconnects prematurely.

### Invariant 3: Authentication & Token Blacklisting
- Passwords are encrypted using `bcrypt` with salt rounds. Bcrypt imposes a hard limit of 72 bytes; [schemas.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/schemas.py) strictly validates password byte length (`<= 72` bytes and `>= 8` characters).
- Tokens are HS256 JWTs with a unique JWT ID (`jti`) and 60-minute expiration.
- Logging out (`POST /auth/logout`) extracts `jti` and writes it to Redis under `blacklist:<jti>` with a TTL matching remaining lifespan.
- If Redis is temporarily unreachable, `is_token_blacklisted` fails open gracefully with a warning to prevent total system lockouts.

### Invariant 4: Administrative Elevation & CLI
Administrator status (`is_admin=True`) grants access to `/api/v1/admin/*` and the frontend `/admin` dashboard.
An "Admin Dashboard" navigation button is dynamically rendered in [Sidebar.tsx](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/components/Sidebar.tsx) for all users with `user.is_admin === true`.

### Invariant 5: Real-Time Optimistic & Streaming Conversation Titles
1. **Immediate Optimistic Title**: Upon message submission in a new chat, [useChatStream.ts](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/hooks/useChatStream.ts) immediately creates/updates the sidebar conversation item with a truncated slice of the user's prompt (`prompt.slice(0, 28) + '...'`).
2. **Parallel Title Stream**: Concurrently with the message generation stream (`POST /chat`), the frontend dispatches `POST /chat/title-stream`.
3. **Visual Streaming Indicator**: While the title is actively streaming, `streamingTitleConvId` is populated, rendering a pulsing blue glowing dot (`animate-ping` + shadow glow) beside the title in [Sidebar.tsx](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/components/Sidebar.tsx).
4. **Dynamic Multi-Turn Adaptation**: For turns 1–3 of a conversation (`messages.length <= 5`), the title stream re-evaluates conversational context (last 6 messages) to adapt and refine the conversation title as the topic evolves, after which the title stabilizes.
5. **Reasoning Token Headroom**: `GroqProvider.generate_title_stream` allocates `max_tokens=200` to prevent token starvation on reasoning models (e.g., `openai/gpt-oss-120b`).
6. **Isolated Database Persistence**: `stream_title_endpoint` in [backend/api.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/api.py) operates inside an independent `AsyncSessionLocal()` scope to safely persist titles without interfering with concurrent conversation message writes.

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
   - Run `cd frontend && npm run build` to confirm type correctness and bundle integrity.
   - Run `python backend/verify_servers.py` when live services are being tested.
4. **Synchronize Living Documentation**:
   - Update `AGENTS.md` and `SKILLS.md` in the same turn if any contract, route, or operational workflow changed.

---

## 7. Git Repository Synchronization Standard

- **Canonical GitHub Remote**: `https://github.com/lokesh0606/qwipi_og.git`
- **Active Branch**: `main`
- **Author Configuration**: `LOKESH KANKALAPATI <lokeshkankalapati06@gmail.com>`
- Strictly avoid staging secrets (`.env`, database files, or credentials). Always verify `.gitignore` enforcement before committing.
