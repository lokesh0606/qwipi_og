# System Architecture

## High-Level Overview

Qwipi AI is a containerized web application composed of a React frontend, a FastAPI backend, a PostgreSQL database, and a Redis cache. The system is orchestrated via Docker Compose, creating an isolated network (`qwipi-net`) for service communication.

### Service Inventory

| Service | Type | Technology | Port (Internal) | Port (Host) | Responsibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend** | User Interface | React, Vite, Tailwind | N/A (Build) | 5173 (Dev) | servces the SPA, manages user state, handles chat streaming via `fetch` API. |
| **API** | Backend | Python, FastAPI | 8000 | 8000 | exposes REST endpoints, manages authentication (JWT), orchestrates AI model interaction, and handles DB/Cache operations. |
| **DB** | Database | PostgreSQL 17 | 5432 | 5432 | Persistent storage for Users, Conversations, Messages, and Settings. |
| **Redis** | Cache | Redis Alpine | 6379 | 6379 | Implements rate limiting, config caching, and JWT token blacklisting. |

## Communication Protocols

### 1. Frontend <-> Backend
- **Protocol**: HTTP/1.1 (REST)
- **Data Format**: JSON for standard requests; Server-Sent Events (SSE-like) text streams for Chat.
- **Authentication**: Bearer Token (JWT) in `Authorization` header.
- **Network**: In development, Frontend requests `http://localhost:8000`. In Docker, they would communicate via ingress or public port mapping.

### 2. Backend <-> Database
- **Protocol**: TCP / PostgreSQL Wire Protocol
- **Driver**: `asyncpg` (Asynchronous) for API operations; `psycopg2` for synchronous migrations (Alembic).
- **ConnectionString**: `postgresql+asyncpg://${USER}:${PASS}@db:5432/${DB}`
- **Network**: Internal Docker Network `qwipi-net`. Hostname: `db`.

### 3. Backend <-> Redis
- **Protocol**: RESP (Redis Serialization Protocol)
- **Library**: `redis-py` (Async).
- **ConnectionString**: `redis://redis:6379/0`
- **Network**: Internal Docker Network `qwipi-net`. Hostname: `redis`.

### 4. Backend <-> Azure OpenAI
- **Protocol**: HTTPS
- **Authentication**: API Key via Environment Variable.
- **Traffic**: Outbound to Azure Cloud endpoints.

## Infrastructure & Deployment

- **Orchestration**: `docker-compose.yml` defines the multi-container setup.
- **Networking**: A custom bridge network `qwipi-net` ensures container isolation while allowing service discovery by container name.
- **Volumes**:
    - `postgres_data`: Persists database files.
    - `redis_data`: Persists cache dumps (RDB/AOF).
- **Environment Management**: Key secrets (DB passwords, API keys) are injected via `.env` file into containers.

## Cross-Cutting Concerns

- **CORS**: Configured in `api.py` to allow requests from `http://localhost:5173` and `http://localhost:3000`.
- **Rate Limiting**: Implemented using `slowapi` backed by Redis. Limits Auth endpoints (5/min).
- **Security**:
    - Passwords hashed via `bcrypt`.
    - Stateless JWT authentication.
    - Token invalidation via Redis blacklist.
