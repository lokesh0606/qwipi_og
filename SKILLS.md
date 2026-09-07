# SKILLS.md — Qwipi Master Skills Catalog & Operational Runbooks

> **Scope**: Standard Operating Procedures (SOPs), capability guides, and CLI execution runbooks for AI agents and human developers operating within Qwipi.  
> **Architecture**: Complements on-demand progressive disclosure skills located under [`.agents/skills/`](.agents/skills/).

---

## 🗺️ Master Skills Catalog

| Skill Identifier | Name & Scope | Location | Primary Triggers |
| :--- | :--- | :--- | :--- |
| **`qwipi-chat-streaming`** | Multi-Turn LLM Streaming & Titles | [`.agents/skills/qwipi-chat-streaming/SKILL.md`](.agents/skills/qwipi-chat-streaming/SKILL.md) | Chat endpoints, `useChatStream.ts`, SSE/text streams, title adaptation, rAF batching. |
| **`qwipi-navigation`** | Codebase Navigation & Blast Radius | [`.agents/skills/qwipi-navigation/SKILL.md`](.agents/skills/qwipi-navigation/SKILL.md) | Tracing contracts from DB to UI, planning cross-stack features, evaluating dependencies. |
| **`qwipi-verification`** | Full-Stack Server Verification | [`.agents/skills/qwipi-verification/SKILL.md`](.agents/skills/qwipi-verification/SKILL.md) | Pre-flight compilation, TypeScript builds, live diagnostic scripts (`verify_servers.py`). |

---

## 🛠️ Operational Runbooks & Procedures

### [SOP-01] Full-Stack Verification & Diagnostics
Run when verifying changes to backend endpoints, auth, streaming logic, or onboarding to a running environment.
```bash
# 1. Static compilation check
python -m py_compile backend/api.py backend/chat.py backend/auth.py backend/models.py backend/schemas.py backend/database.py backend/redis_client.py backend/cli.py backend/verify_servers.py

# 2. Frontend type check & production bundle build
cd frontend && npm run build

# 3. Live 5-layer diagnostic suite (TCP, Frontend, Public Endpoints, Auth/Me, Groq Stream)
python backend/verify_servers.py
```

---

### [SOP-02] Adding a New API Endpoint
Follow the strict 5-step pattern in [backend/api.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/api.py):

1. **Define Pydantic Schemas** in [backend/schemas.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/schemas.py):
   ```python
   class ItemCreate(BaseModel):
       name: str
       description: Optional[str] = None

   class ItemResponse(BaseModel):
       id: str
       name: str
       user_id: str
       created_at: datetime
       model_config = ConfigDict(from_attributes=True)

       @field_validator('id', 'user_id', mode='before')
       @classmethod
       def convert_uuid_to_str(cls, v: Any) -> str:
           return str(v) if v else ''
   ```

2. **Declare Route with Dependency Injection & Tenant Isolation**:
   ```python
   @app.post("/items", response_model=ItemResponse)
   @limiter.limit("30/minute")
   async def create_item(
       request: Request,
       item_in: ItemCreate,
       db: AsyncSession = Depends(get_db),
       current_user: User = Depends(get_current_user)  # Enforce auth
   ):
       new_item = Item(name=item_in.name, user_id=current_user.id)
       db.add(new_item)
       await db.commit()
       await db.refresh(new_item)
       return new_item
   ```

3. **Update Frontend Types & Calls**:
   Add corresponding TypeScript interface in [frontend/src/types/index.ts](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/types/index.ts).

4. **Verify**: Check Swagger UI at `http://localhost:8000/docs`.

---

### [SOP-03] Database Migrations (Alembic)
Execute whenever modifying tables or columns in [backend/models.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/models.py):

```bash
# 1. Generate versioned migration script
alembic revision --autogenerate -m "Add new_column to table"

# 2. Inspect generated script in backend/migrations/versions/*.py

# 3. Apply migration to PostgreSQL
alembic upgrade head

# 4. Rollback if needed
alembic downgrade -1
```

---

### [SOP-04] Administrative CLI Management
Key File: [backend/cli.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/cli.py)

```bash
# List all registered users and admin status
python -m backend.cli list-users

# Promote user to administrator (grants access to /admin and admin endpoints)
python -m backend.cli promote-admin user@example.com

# Demote administrator
python -m backend.cli demote-admin user@example.com

# Reset user password directly in PostgreSQL
python -m backend.cli set-password user@example.com NewSecurePassword123!
```

---

### [SOP-05] Docker Compose Orchestration
Key File: [docker-compose.yml](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/docker-compose.yml)

```bash
# Start all 4 tiers in background (db, redis, api, frontend)
docker compose up -d

# Start only infrastructure dependencies
docker compose up -d db redis

# Rebuild images after dependency changes
docker compose build api frontend

# Follow live container logs
docker compose logs -f api
docker compose logs -f db

# Stop containers preserving database volume
docker compose down

# Stop and wipe persistent database volumes (CLEAN RESET - CAUTION)
docker compose down -v
```

---

### [SOP-06] Git Synchronization & Documentation Mandate
Execute at the conclusion of every session modifying codebase behavior:

```bash
# 1. Audit status (ensure .env and secrets are not staged)
git status

# 2. Verify documentation synchronization:
#    - AGENTS.md: contracts, invariants, topography
#    - SKILLS.md: SOPs, skill catalog
#    - .agents/skills/: modular skills

# 3. Stage verified modifications
git add .

# 4. Commit with conventional semantic message
git commit -m "feat/fix/docs: <summary of changes>"

# 5. Push to canonical remote
git push origin main
```
