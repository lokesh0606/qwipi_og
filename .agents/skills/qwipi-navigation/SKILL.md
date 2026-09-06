---
name: qwipi-navigation
description: >-
  Navigate the Qwipi monolithic split codebase, cross-referencing FastAPI backend routes,
  SQLAlchemy models, Pydantic schemas, and React 19 frontend components. Use when locating
  features, mapping dependencies, or evaluating blast radius before edits.
---

# Qwipi Codebase Navigation Skill

## When to Use This Skill
Use this skill when exploring the Qwipi project, tracing data contracts from the database to the UI, finding relevant modules, or planning cross-stack features.

## Topography & Architecture
Qwipi is a monolithic split application:
- **Backend**: Asynchronous FastAPI, SQLAlchemy 2.0 (`asyncpg`), PostgreSQL 17, Redis 8, Groq LPU inference.
- **Frontend**: React 19 SPA, TypeScript, Tailwind CSS v4, Three.js ambient particles, Framer Motion.

## Navigation Protocol

### 1. Cross-Stack Trace Pattern
When tracing any data entity (e.g. Conversations, Messages, Settings):
1. **Database Schema**: Check [backend/models.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/models.py) for SQLAlchemy table structure and relationships.
2. **Serialization & Validation**: Check [backend/schemas.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/schemas.py) for Pydantic v2 schemas and validators.
3. **Endpoints & Permissions**: Check [backend/api.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/api.py) for FastAPI route definitions and `get_current_user` dependencies.
4. **Client-Side Types**: Check [frontend/src/types/index.ts](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/types/index.ts) for matching TypeScript interfaces.
5. **State & Custom Hooks**: Check [frontend/src/contexts/](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/contexts/) and [frontend/src/hooks/useChatStream.ts](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/hooks/useChatStream.ts).
6. **UI Components**: Check [frontend/src/components/](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/components/).

### 2. Blast Radius Evaluation
Before modifying code:
- **Changing backend routes**: Search `frontend/src/` for matching endpoints. Note that base URL is imported from `frontend/src/config/api.ts`.
- **Changing DB models**: Requires generating an Alembic migration (`alembic revision --autogenerate`) and updating Pydantic schemas.
- **Modifying auth**: Note that JWT tokens are stored in `localStorage` as `qwipi_auth_token`, and logout blacklists token JTIs in Redis.
