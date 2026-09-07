---
name: qwipi-navigation
description: >-
  Navigate the Qwipi monolithic split codebase, cross-referencing FastAPI backend routes,
  SQLAlchemy models, Pydantic schemas, and React 19 frontend components. Use when locating
  features, mapping dependencies, or evaluating blast radius before edits.
---

# Qwipi Codebase Navigation Skill

## When to Use This Skill
Use this skill when exploring the Qwipi repository, tracing data contracts from the database to the UI, locating modules, or evaluating blast radius before edits.

---

## Architecture & Topography
Qwipi is a decoupled monolithic split application:
- **Backend Core**: Asynchronous FastAPI, SQLAlchemy 2.0 (`asyncpg`), PostgreSQL 17, Redis 8, Groq LPU inference.
- **Frontend Core**: React 19 SPA, TypeScript, Vite, Tailwind CSS v4, Three.js ambient particles, Framer Motion.

---

## Cross-Stack Navigation Protocol

### 1. Data Contract Trace Sequence
When creating or modifying any data entity (e.g., Users, Conversations, Messages, Settings, SystemConfig):
1. **Database ORM**: Check [backend/models.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/models.py) for SQLAlchemy table definition, foreign keys, and cascading relationships.
2. **Serialization & Validation**: Check [backend/schemas.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/schemas.py) for Pydantic v2 schemas and UUID-to-string validators (`convert_uuid_to_str`).
3. **API Routing & Dependency Injection**: Check [backend/api.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/api.py) for route declaration, rate limiting, and `get_current_user` tenant isolation.
4. **Client-Side Types**: Check [frontend/src/types/index.ts](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/types/index.ts) for matching TypeScript interfaces.
5. **State Management**: Check [frontend/src/contexts/](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/contexts/) (`AuthContext`, `SettingsContext`, `BrandingContext`) and [frontend/src/hooks/useChatStream.ts](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/hooks/useChatStream.ts).
6. **UI Presentation**: Check [frontend/src/components/](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/components/).

---

## Blast Radius Evaluation Checklist
Before modifying any file:
- **Modifying backend routes**: Check `frontend/src/` for matching endpoint calls. Remember API base URL is resolved in [frontend/src/config/api.ts](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/config/api.ts).
- **Modifying ORM models**: Generates a database migration (`alembic revision --autogenerate`) and requires updating Pydantic schemas and TypeScript interfaces.
- **Modifying auth**: JWT token is stored in `localStorage` under `qwipi_auth_token`. Logout invalidates the token in Redis under `blacklist:<jti>`.
