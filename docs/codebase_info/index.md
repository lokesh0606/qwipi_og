# Qwipi Codebase Skills & Context

> [!NOTE]
> This directory maps the architecture, features, and contracts of the Qwipi application. It serves as the "Source of Truth" for AI agents and developers.

## 🧠 System Brain (Global Context)

Qwipi is a **Monolithic Split** application.
*   **Backend**: FastAPI (Async) + PostgreSQL (SQLAlchemy) + Azure OpenAI.
*   **Frontend**: React (Vite) + TypeScript + TailwindCSS.

### 🌐 Global Dependency Graph
1.  **Infrastructure Layer**: `backend_flow.md` + `.env`
    *   *Provides*: API Server, DB Connection, LLM Client.
2.  **Integration Layer**: `data_contracts.md`
    *   *Provides*: Shared shapes (TS Interfaces <-> Pydantic Models).
    *   *Connects*: Backend Data <-> Frontend Type Safety.
3.  **Feature Layer**: `features/*.md`
    *   *Consumes*: Infrastructure + Integration.
    *   *Provides*: User value (Chat, Sidebar, Titles).

---

## 🤖 Agent Protocol (Pre-Flight Checklist)
**STOP.** Before modifying ANY code, you MUST execute this protocol:

1.  **Identify Target Scope**: Which file/feature are you editing?
2.  **Locate Skill File**: Find the corresponding `.md` file in `docs/codebase_info/`.
3.  **Check Blast Radius**: Read the "Side-Effect Warnings" in that Skill file.
4.  **Verify Coupling**:
    *   If editing `api.py` -> Check `frontend/src/types` sync.
    *   If editing `ChatInterface.tsx` -> Check `api.py` response shape.

---

## 🗺️ Skill Map

### 1. [Features](./features/)
Atomic units of user functionality.
- [Chat System](./features/chat_system.md): **Core Skill**. The complete lifecycle of a message (UI -> API -> LLM -> UI).

### 2. [Infrastructure](./infrastructure/)
The bedrock technology.
- [Backend Flow](./infrastructure/backend_flow.md): FastAPI architecture, middleware, and request lifecycle.
- [API Endpoints](./infrastructure/api_endpoints.md): Route definitions.
- [DB Schema](./infrastructure/db_schema.md): Data persistence rules.
- [Frontend Architecture](./infrastructure/frontend_architecture.md): React state & component tree.
- [Authentication](./infrastructure/auth_system.md): **NEW**. JWT flow and interceptors.
- [Redis Integration](./infrastructure/redis_integration.md): **NEW**. Rate limiting and blacklisting.

### 3. [Integration](./integration/)
The "Glue" and contracts.
- [Data Contracts](./integration/data_contracts.md): **CRITICAL**. Maps Python Models to TypeScript Interfaces.
- [State Side Effects](./integration/state_side_effects.md): Global side-effects.

---

## ⚙️ Configuration & Connectivity
Qwipi relies on a robust integration with **Azure OpenAI**.
- **Environment Driven**: All credentials (API Key, Endpoint, Deployment) are managed via `.env`.
- **Robust LLM Client**: The system includes logic in `chat.py` to automatically sanitize endpoints and extract deployment names from URLs, ensuring high reliability across different Azure configurations.
