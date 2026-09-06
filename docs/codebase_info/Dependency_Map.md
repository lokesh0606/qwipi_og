# Dependency Map

## File-Level Dependencies

### Backend (`backend/`)

| File | Depends On (Imports) | Used By (Imported In) | Description |
| :--- | :--- | :--- | :--- |
| `api.py` | `models`, `schemas`, `database`, `auth`, `chat`, `redis_client` | Entry Point (Uvicorn) | Main application file. Orchestrates all modules. |
| `models.py` | `database` (Base) | `api`, `auth`, `chat` | Defines Database Schema (ORM). |
| `schemas.py` | Pydantic | `api`, `auth` | Defines API Request/Response Models. |
| `database.py` | SQLAlchemy | `models`, `api`, `auth` | Manages DB Connection/Session. |
| `auth.py` | `models`, `schemas`, `database` | `api` | Handles Password Hashing & JWT Logic. |
| `chat.py` | OpenAI SDK | `api` | Wrapper for Azure OpenAI Client. |
| `redis_client.py`| `redis` (library) | `api` | Wrapper for Redis Connection Pool. |

### Frontend (`frontend/src/`)

| File | Depends On (Imports) | Used By (Imported In) | Description |
| :--- | :--- | :--- | :--- |
| `main.tsx` | `App`, `AuthContext`, `SettingsContext` | Entry Point (Index.html) | Bootstraps React App. |
| `App.tsx` | `components/*`, `contexts/*` | `main` | Defines Routing & Layout. |
| `contexts/AuthContext`| `axios`, `types` | `main`, `ProtectedRoute`, `Login` | Manages Global Auth State. |
| `hooks/useChatStream`| `SettingsContext`, `types` | `ChatInterface` | Encapsulates Chat Logic. |
| `components/ChatInterface`| `Sidebar`, `MessageList`, `ChatInput` | `App` | Main Chat UI Container. |

## Hidden & System Dependencies

These dependencies are not explicitly imported in code but are required for the system to function.

### 1. Environment Configuration
- **`docker-compose.yml`** depends on **`.env`**
    - *Reason*: Injects sensitive secrets (`POSTGRES_PASSWORD`, `AZURE_OPENAI_API_KEY`) into containers.
    - *Risk*: Missing `.env` file causes container startup failure.

### 2. Network Services
- **Backend API (`api`)** depends on **Database (`db`)**
    - *Port*: `5432` (Internal)
    - *Reason*: `api` container must resolve hostname `db` to connect to PostgreSQL.
- **Backend API (`api`)** depends on **Redis (`redis`)**
    - *Port*: `6379` (Internal)
    - *Reason*: `api` container must resolve hostname `redis` for caching.
- **Frontend** depends on **Backend API**
    - *Url*: `http://localhost:8000` (Hardcoded in `AuthContext.tsx` and `useChatStream.ts`)
    - *Risk*: If Backend is not running on port 8000, Frontend API calls fail immediately.

### 3. External Services
- **Backend API** depends on **Azure OpenAI**
    - *Requirement*: Valid Internet Access + API Key.
    - *Risk*: Network firewall or expired key breaks Chat functionality.
