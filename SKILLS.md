# SKILLS.md — Qwipi Operational Runbooks & Skills Catalog

> **Scope**: Standard Operating Procedures (SOPs), procedural runbooks, and capability guides for AI agents and human developers executing work on the Qwipi platform.  
> **Antigravity Integration**: Complements native progressive-disclosure skills located under `.agents/skills/`.

---

## 🗺️ Master Skill Map

```
                                  QWIPI SKILLS CATALOG
   ┌────────────────────────────────────────┬────────────────────────────────────────┐
   │          BACKEND PROCEDURES            │          FRONTEND PROCEDURES           │
   ├────────────────────────────────────────┼────────────────────────────────────────┤
   │ [SKILL-01] Full-Stack Verification     │ [SKILL-05] Streaming State Management  │
   │ [SKILL-02] Adding an API Endpoint      │ [SKILL-06] Global Contexts & Branding  │
   │ [SKILL-03] Database & Alembic Workflow │ [SKILL-07] 3D Particle & Glow Tuning   │
   │ [SKILL-04] LLM Provider Extension      │ [SKILL-08] Frontend Build & Type Check │
   ├────────────────────────────────────────┴────────────────────────────────────────┤
   │                         DEVOPS & ADMINISTRATION                                 │
   ├─────────────────────────────────────────────────────────────────────────────────┤
   │ [SKILL-09] User & Admin CLI Management                                          │
   │ [SKILL-10] Docker Compose Full-Stack Orchestration                              │
   └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## [SKILL-01] Full-Stack Server Verification & Diagnostics

### When to Use
Execute this skill whenever making changes to backend endpoints, database models, authentication, streaming logic, or when onboarding to the codebase.

### Procedure
Run the dedicated diagnostic verification suite:
```bash
python backend/verify_servers.py
```

### Diagnostic Checklist
The script checks 5 core layers sequentially:
1. **TCP Connectivity**: Validates PostgreSQL (port 5432) and Redis (port 6379) are reachable.
2. **Frontend Availability**: Pings `http://localhost:5173/` for HTTP 200 SPA response.
3. **Public API Endpoints**: Tests `/health`, `/docs`, `/openapi.json`, `/api/v1/config/public`, `/api/v1/models`.
4. **Auth & Protected Routes**: Tests `/auth/login`, retrieves JWT, checks `/auth/me` and `/conversations`.
5. **Live Groq LLM Streaming**: Sends a test prompt to `POST /chat` and streams back tokens over SSE.

### Failure Recovery
- **PostgreSQL / Redis DOWN**: Run `docker compose up -d db redis`.
- **Backend Connection Refused**: Run `uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload`.
- **Groq API Error / 401 Unauthorized**: Check that `GROQ_API_KEY` is present and non-empty in `.env`.

---

## [SKILL-02] Adding a New API Endpoint

### When to Use
Whenever extending the FastAPI backend with new routes or data operations.

### Procedure
Follow this strict 5-step pattern in [backend/api.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/api.py):

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

2. **Declare Route with Dependency Injection**:
   ```python
   @app.post("/items", response_model=ItemResponse)
   @limiter.limit("30/minute")
   async def create_item(
       request: Request,
       item_in: ItemCreate,
       db: AsyncSession = Depends(get_db),
       current_user: User = Depends(get_current_user)  # Enforce auth
   ):
   ```

3. **Enforce Tenant Isolation in Query**:
   Always attach `user_id=current_user.id` to models and queries:
   ```python
   new_item = Item(
       name=item_in.name,
       user_id=current_user.id
   )
   db.add(new_item)
   await db.commit()
   await db.refresh(new_item)
   return new_item
   ```

4. **Update Frontend Types & Call**:
   Add corresponding TypeScript interface in [frontend/src/types/index.ts](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/types/index.ts).

5. **Verify**:
   Check `/docs` (Swagger UI) at `http://localhost:8000/docs`.

---

## [SKILL-03] Database Schema Alterations & Alembic Migrations

### When to Use
When modifying, adding, or deleting columns/tables in [backend/models.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/models.py).

### Procedure
1. **Modify Model in `backend/models.py`**:
   ```python
   class User(Base):
       # ...
       new_column = Column(String, nullable=True)
   ```

2. **Generate Versioned Migration**:
   ```bash
   # Ensure PostgreSQL is accessible
   alembic revision --autogenerate -m "Add new_column to users"
   ```

3. **Inspect Generated Migration File**:
   Review the generated script in `backend/migrations/versions/*.py` to ensure only intended changes were captured.

4. **Apply Migration**:
   ```bash
   alembic upgrade head
   ```

5. **Rollback (If Needed)**:
   ```bash
   alembic downgrade -1
   ```

---

## [SKILL-04] LLM Engine & Provider Extension

### When to Use
When adding a new inference provider (e.g., Anthropic, Ollama) or updating model definitions.

### Architecture in [backend/chat.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/chat.py)
All providers inherit from `BaseLLMProvider`:
```python
class BaseLLMProvider:
    async def client(
        self, 
        messages: List[Dict[str, str]], 
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        raise NotImplementedError
        
    async def generate_title_stream(
        self, 
        conversation_messages: List[Dict[str, str]]
    ) -> AsyncGenerator[str, None]:
        raise NotImplementedError
```

### Steps to Add a New Provider
1. Subclass `BaseLLMProvider` in `backend/chat.py`.
2. Implement streaming via `async for chunk in client.chat.completions.create(stream=True)`.
3. Register the new provider class in `LLMFactory.get_provider()`:
   ```python
   @classmethod
   async def get_provider(cls, provider_name: str, model_name: Optional[str] = None, db: Optional[AsyncSession] = None):
       if provider_name.lower() == "myprovider":
           return MyNewProvider(model_name=model_name)
       # ...
   ```
4. Expose the provider and models in `LLMFactory.get_enabled_providers()`.

---

## [SKILL-05] Frontend Streaming & Chat State Management

### Key File: [frontend/src/hooks/useChatStream.ts](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/hooks/useChatStream.ts)

### How Streaming Works
1. **Trigger**: User enters prompt and hits Submit in `ChatInput.tsx`.
2. **Optimistic UI**: User message is immediately appended to local state `messages`.
3. **HTTP Fetch**: A POST request is dispatched to `${API_BASE_URL}/chat` with `Authorization: Bearer <token>`.
4. **Header Capture**: The response header `X-Conversation-Id` is inspected:
   - If starting a new chat, the conversation ID is captured and set as active.
   - Title streaming is simultaneously initiated via `POST /chat/title-stream`.
5. **SSE / Chunk Decoding**:
   ```typescript
   const reader = response.body.getReader();
   const decoder = new TextDecoder();
   while (true) {
       const { value, done } = await reader.read();
       if (done) break;
       const chunk = decoder.decode(value, { stream: true });
       // Update assistant message content in state
   }
   ```
6. **Cancellation**: If user aborts, call `abortController.abort()`.

---

## [SKILL-06] Global Contexts & Dynamic Branding

### Context Hierarchy in `frontend/src/contexts/`
1. **`AuthContext.tsx`**:
   - Stores JWT token in `localStorage` under `qwipi_auth_token`.
   - Exposes `user`, `login(email, password)`, `signup(email, password)`, `logout()`.
2. **`SettingsContext.tsx`**:
   - Manages user preferences: `theme` (dark/light), `provider` (groq), `model`, `enable_glow`.
   - Persists settings changes via `PATCH /settings`.
   - Exposes `lastClearedAt` timestamp for triggering instant conversation list clears.
3. **`BrandingContext.tsx`**:
   - Fetches public configuration from `/api/v1/config/public` on app load.
   - Automatically injects the dynamic application name across headers, modals, and page titles.

---

## [SKILL-07] 3D Particle Canvas & Ambient Motion

### Key Files:
- [frontend/src/components/Scene.tsx](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/components/Scene.tsx): Interactive Three.js canvas utilizing `@react-three/fiber` and `@react-three/drei`.
- [frontend/src/components/GlowAnimation.tsx](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/components/GlowAnimation.tsx): Framer Motion glow effect controlled by `enable_glow` in settings.

### Best Practices:
- Keep the 3D particle count conservative (<1000 particles) to preserve GPU cycles for low-spec client machines.
- Ensure `Scene.tsx` is conditionally mounted or paused when browser tab is inactive.
- Respect user preference: If `enable_glow` is toggled off in `SettingsModal.tsx`, completely unmount the blur filters to minimize rendering load.

---

## [SKILL-08] Frontend Build, Lint & Type Validation

### Procedure
Always run these checks before submitting frontend code changes:

```bash
cd frontend

# 1. Check TypeScript types
npx tsc --noEmit

# 2. Run ESLint
npm run lint

# 3. Test Production Build
npm run build
```

---

## [SKILL-09] User & Admin CLI Management

### Key File: [backend/cli.py](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/backend/cli.py)

### Common Administrative Commands
```bash
# List all registered users and admin status
python -m backend.cli list-users

# Promote user to administrator (grants access to /admin and PATCH /api/v1/admin/config)
python -m backend.cli promote-admin user@example.com

# Demote user from administrator
python -m backend.cli demote-admin user@example.com

# Reset user password directly in the database
python -m backend.cli set-password user@example.com NewSecurePassword123!
```

---

## [SKILL-10] Docker Compose Full-Stack Orchestration

### Key File: [docker-compose.yml](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/docker-compose.yml)

### Operational Runbook
```bash
# Start all services in background
docker compose up -d

# Start only infrastructure (PostgreSQL & Redis)
docker compose up -d db redis

# Rebuild API or Frontend after Dockerfile/dependency changes
docker compose build api frontend

# View live container logs
docker compose logs -f api
docker compose logs -f db

# Stop all containers preserving persistent database volumes
docker compose down

# Stop containers and wipe volumes (CLEAN RESET - CAUTION)
docker compose down -v
```
