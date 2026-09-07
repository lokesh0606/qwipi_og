---
name: qwipi-verification
description: >-
  Execute end-to-end diagnostic checks, server verifications, TCP port inspections,
  and live LLM streaming tests for the Qwipi application. Use when validating that changes
  build cleanly and services operate without errors.
---

# Qwipi Full-Stack Verification Skill

## When to Use This Skill
Use this skill after making changes to backend endpoints, frontend components, database models, authentication, or Docker configurations, to confirm that all layers function properly.

---

## Static & Build Checks

### 1. Backend Python Syntax Compilation
Verify all Python files compile cleanly without syntax errors:
```bash
python -m py_compile backend/api.py backend/chat.py backend/auth.py backend/models.py backend/schemas.py backend/database.py backend/redis_client.py backend/cli.py backend/verify_servers.py
```

### 2. Frontend Type Check & Production Build
Ensure TypeScript types are valid and Vite packages the production bundle:
```bash
cd frontend
npm run build
```

---

## Full Diagnostic Suite Execution

Execute the automated test script [backend/verify_servers.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/verify_servers.py):
```bash
python backend/verify_servers.py
```

### Interpreting Diagnostic Layers
1. **Layer 1: Database & Cache TCP Ports**:
   - `PostgreSQL (localhost:5432): UP`
   - `Redis (localhost:6379): UP`
   - *Remediation if DOWN*: `docker compose up -d db redis`
2. **Layer 2: Frontend SPA Server**:
   - `Frontend (http://localhost:5173/): HTTP 200 OK`
   - *Remediation if FAILED*: `cd frontend && npm run dev`
3. **Layer 3: Backend Public Endpoints**:
   - Validates `/health`, `/docs`, `/openapi.json`, `/api/v1/config/public`.
4. **Layer 4: Authentication & User Scope**:
   - Performs test login, verifies JWT generation, checks `/auth/me` and `/api/v1/models`.
5. **Layer 5: Live Groq LLM Streaming**:
   - Streams raw tokens from Groq LPU via `POST /chat`.
