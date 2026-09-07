# Qwipi Backend API

> Asynchronous FastAPI backend providing multi-tenant authentication, multi-turn LLM streaming via Groq LPU, Redis token revocation/rate-limiting, and PostgreSQL conversational persistence.

---

## 🏗️ Architecture & Technology Stack

- **Framework**: FastAPI `0.141` + Starlette `1.6` (ASGI)
- **Runtime**: Python 3.11+
- **Database**: PostgreSQL 17 via async SQLAlchemy 2.0 (`asyncpg`)
- **Database Migrations**: Alembic (`psycopg2-binary`)
- **Cache & Revocation**: Redis 8 (`redis-py` async client)
- **LLM Inference**: Groq LPU via `AsyncOpenAI` client
- **Rate Limiting**: `slowapi` backed by Redis storage
- **Authentication**: `bcrypt` password hashing + HS256 JWT tokens

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the repository root or `backend/` directory from `.env.example`:

```bash
# Core LLM Engine
GROQ_API_KEY=gsk_your_groq_api_key_here

# PostgreSQL Database (Asyncpg)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/qwipi_db

# Redis In-Memory Store
REDIS_URL=redis://localhost:6379/0

# JWT Authentication
SECRET_KEY=your-super-secret-hex-encoded-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Initial Superuser Auto-Promotion
FIRST_SUPERUSER_EMAIL=admin@example.com

# CORS Allowed Origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 🚀 Running the Backend

### Method 1: Local Virtual Environment
```bash
# 1. Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Ensure PostgreSQL and Redis are running
docker compose up -d db redis

# 4. Start ASGI server with live reload
uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload
```

- Swagger UI Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### Method 2: Docker Compose Full Stack
```bash
docker compose up -d api
```

---

## 🗄️ Database Migrations (Alembic)

```bash
# Generate versioned migration script after modifying models.py
alembic revision --autogenerate -m "Add description of changes"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

---

## 🛡️ Administrative CLI

Use `backend/cli.py` to manage system users and elevate administrators:

```bash
# List all registered users
python -m backend.cli list-users

# Promote user to administrator
python -m backend.cli promote-admin user@example.com

# Demote administrator
python -m backend.cli demote-admin user@example.com

# Reset user password
python -m backend.cli set-password user@example.com NewSecurePassword123!
```

---

## 🧪 Verification & Diagnostics

Run the full diagnostic suite to verify TCP connectivity, public endpoints, auth, and live LLM streaming:

```bash
python backend/verify_servers.py
```