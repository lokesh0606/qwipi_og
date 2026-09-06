# Qwipi AI

> Multi-tenant, streaming-first artificial intelligence conversation workspace powered by FastAPI, Groq LPU inference, and React 19.

---

## 🚀 Quick Navigation for Developers & AI Agents

- **[AGENTS.md](AGENTS.md)** — Architectural manifesto, repository topography, cross-stack data contracts, security invariants, and rules of engagement.
- **[SKILLS.md](SKILLS.md)** — Procedural runbooks and standard operating procedures (adding endpoints, database migrations, LLM streaming, server verification).
- **[.agents/skills/](.agents/skills/)** — Native progressive-disclosure skills for Google Antigravity and AI coding assistants.

---

## ⚡ Quick Start

### 1. Docker Compose (Recommended)
Run all 4 tiers (PostgreSQL 17, Redis, FastAPI, React Vite SPA):
```bash
docker compose up -d
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Verify System Health
Run the comprehensive diagnostic test:
```bash
python backend/verify_servers.py
```
