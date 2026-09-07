# Qwipi AI

> **Multi-tenant, streaming-first artificial intelligence workspace** powered by FastAPI, Groq LPU inference, PostgreSQL 17, Redis 8, and React 19.

---

## ⚡ Overview

Qwipi provides an ultra-low latency AI conversational experience with per-user data tenancy, stateful session caching, dynamic runtime model selection, adaptive conversation title streaming, and customizable enterprise branding.

```
┌───────────────────────────┐      ┌───────────────────────────┐
│ React 19 + Three.js SPA   │ ───► │ FastAPI Async Backend     │
│ Vite + Tailwind CSS v4    │ ◄─── │ Uvicorn / Gunicorn ASGI   │
└───────────────────────────┘      └─────────────┬─────────────┘
                                                 │
                                 ┌───────────────┴───────────────┐
                                 ▼                               ▼
                   ┌───────────────────────────┐   ┌───────────────────────────┐
                   │ PostgreSQL 17 (Asyncpg)   │   │ Redis 8 (Cache & Auth)    │
                   │ Chats, Messages, Settings │   │ Blacklist & Rate Limiting │
                   └───────────────────────────┘   └───────────────────────────┘
```

---

## 🧭 System Documentation & Frontier Standards

| Resource | Purpose |
| :--- | :--- |
| **[`AGENTS.md`](AGENTS.md)** | **Canonical AI Agent Manifesto**: Architectural invariants, cross-stack contracts, security rules, and pre-flight protocols (OpenAI / Anthropic / Antigravity standard). |
| **[`SKILLS.md`](SKILLS.md)** | **Master Skills Catalog & Operational Runbooks**: Verification, API extensions, Alembic migrations, Docker, and Admin CLI. |
| **[`.agents/skills/`](.agents/skills/)** | **Progressive Disclosure Skills**: On-demand modular guides for streaming, navigation, and server verification. |
| **[`backend/README.md`](backend/README.md)** | **Backend Guide**: Python setup, environment variables, migrations, and CLI management. |
| **[`frontend/README.md`](frontend/README.md)** | **Frontend Guide**: React 19 SPA, Tailwind CSS v4, Three.js visuals, and streaming hook. |

---

## 🚀 Quick Start

### 1. Full-Stack Docker Compose (Recommended)
Run all 4 tiers (PostgreSQL 17, Redis 8, FastAPI backend, React 19 SPA):
```bash
# 1. Create .env from template
cp .env.example .env

# 2. Launch container stack
docker compose up -d

# 3. Access applications
# Frontend: http://localhost:5173
# Backend API Docs: http://localhost:8000/docs
```

### 2. Bare-Metal Local Development
```bash
# Infrastructure
docker compose up -d db redis

# Backend (Terminal 1)
python -m venv venv
venv\Scripts\activate  # Windows (or source venv/bin/activate on Linux/macOS)
pip install -r backend/requirements.txt
uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

### 3. Verification & Diagnostic Test
Run the automated 5-layer diagnostic suite:
```bash
python backend/verify_servers.py
```
