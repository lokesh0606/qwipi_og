---
name: qwipi-verification
description: >-
  Execute end-to-end diagnostic checks, server verifications, TCP port inspections,
  and live LLM streaming tests for the Qwipi application. Use when validating that changes
  build cleanly and services operate without errors.
---

# Qwipi Full-Stack Verification Skill

## When to Use This Skill
Use this skill after modifying backend endpoints, frontend components, database models, authentication, or Docker configurations, to confirm that all layers function properly.

## Instructions

### 1. Run Static Compilation Checks
Before running live tests, verify Python files compile cleanly:
```bash
python -m py_compile backend/api.py backend/chat.py backend/auth.py backend/models.py backend/schemas.py backend/database.py
```

### 2. Run TypeScript & Lint Checks
```bash
cd frontend
npx tsc --noEmit
npm run lint
```

### 3. Run Full Diagnostic Suite
Execute the automated test script [backend/verify_servers.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/verify_servers.py):
```bash
python backend/verify_servers.py
```

### 4. Interpreting Diagnostic Output
- **Layer 1 (Database & Cache)**:
  - `PostgreSQL (localhost:5432): UP`
  - `Redis (localhost:6379): UP`
  If DOWN, start them with: `docker compose up -d db redis`.
- **Layer 2 (Frontend)**:
  - `Frontend (http://localhost:5173/): HTTP 200 OK`
  If FAILED, start with: `cd frontend && npm run dev`.
- **Layer 3 (Backend Public Endpoints)**:
  - Validates `/health`, `/docs`, `/openapi.json`, `/api/v1/config/public`, `/api/v1/models`.
- **Layer 4 (Authentication & Protected Endpoints)**:
  - Logs in, retrieves JWT, checks `/auth/me` and `/conversations`.
- **Layer 5 (LLM Chat Streaming)**:
  - Streams response tokens from Groq LPU API via `POST /chat`.
