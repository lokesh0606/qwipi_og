# Service Deep Dive

## Backend Service (API)

The Backend API is the central nervous system, built with FastAPI. It handles business logic, data persistence, and AI orchestration.

### Entry Point: `backend/api.py`
The application initializes as a `FastAPI` instance with a custom `lifespan` context manager.
- **Lifespan**: Asynchronously connects to PostgreSQL via `sqlalchemy` and Redis via `redis-py` on startup. Closes connections on shutdown.
- **Middleware**:
    - `CORSMiddleware`: Restricts cross-origin requests to trusted domains (Localhost dev ports).
    - `SlowAPI`: Wraps endpoints with rate limiting logic, using Redis as the storage backend.

### Core Modules

#### Authentication (`backend/auth.py` & Endpoints)
- **Responsibility**: Validate credentials, issue tokens, manage session lifecycle.
- **Flow**:
    1.  **Signup**: Validate email uniqueness -> Hash password (`bcrypt`) -> Create User + Default Settings -> Return JWT.
    2.  **Login**: Validate credentials -> Generate Access Token (15m expiry) -> Return JWT.
    3.  **Logout**: Decode JWT -> Extract JTI (Token ID) -> Add JTI to Redis Blacklist with TTL = remaining token life.
    4.  **Protection**: `get_current_user` dependency verifies JWT signature and checks Redis blacklist.

#### Database Logic (`backend/models.py` & `backend/database.py`)
- **ORM**: SQLAlchemy (Async). Uses declarative `Base`.
- **Schema**:
    - **User**: Table `users`. Relationships: `conversations` (1:N), `settings` (1:1).
    - **Conversation**: Table `conversations`. Links User to Messages.
    - **Message**: Table `messages`. Stores role, content, timestamp.
    - **Settings**: Table `settings`. Stores user preferences (Theme, AI Model).
    - **SystemConfig**: Table `system_config`. Key-Value store for global updates (e.g., App Name).

#### Chat Logic (`backend/chat.py` & Endpoints)
- **Responsibility**: Interface with LLM providers (Azure OpenAI).
- **Streaming Pipeline**:
    1.  **Request**: User sends prompt + `conversation_id`.
    2.  **Processing**: App creates/updates Conversation -> Saves User Message.
    3.  **Generation**: `AzureOpenAI` client streams chunks back to client via `StreamingResponse`.
    4.  **Completion**: Full assistant response is assembled and saved to `Message` table asynchronously.
- **Title Generation**: Separate endpoint `/chat/title-stream` uses LLM to name a conversation based on initial messages.

#### Configuration Management (`backend/api.py`)
- **Strategy**: Hybrid Cache-Aside pattern.
- **Read**: Check Redis for `app_name` -> If miss, query DB -> Cache result (TTL 1hr).
- **Write**: Update DB -> Invalidate Redis key.

---

## Frontend Service (Client)

The Frontend is a Single Page Application (SPA) built with React and Vite. It serves as the primary user interface.

### Entry Point & Routing
- **Entry**: `src/main.tsx` mounts the application and wraps it in global providers: `BrowserRouter`, `AuthProvider`, `SettingsProvider`.
- **Router (`src/App.tsx`)**:
    - **Public**: `/login`, `/signup`.
    - **Protected**: `/` (Chat Interface), `/admin` (Dashboard).
    - **Guard**: `ProtectedRoute` component checks `isAuthenticated` from `AuthContext` and redirects unauthenticated users.

### State Management (Contexts)

#### AuthContext (`src/contexts/AuthContext.tsx`)
- **Responsibility**: Manage user session.
- **Logic**:
    - Initializes from `localStorage` (persists token/user).
    - Provides `login/signup` methods that call backend API.
    - Intercepts all `axios` requests to inject `Authorization: Bearer <token>`.
    - Intercepts 401 responses to auto-logout.

#### SettingsContext (`src/hooks/useSettings.ts` / Context)
- **Responsibility**: Sync user preferences.
- **Logic**: Fetches settings from backend on load. Updates local state and remote DB on change. Handles "Clear All Chats" action.

### Feature Modules

#### Chat Interface (`src/components/ChatInterface.tsx`)
- **Responsibility**: Main UI for interaction.
- **Logic**:
    - Manages sidebar state (mobile).
    - Renders `MessageList` and `ChatInput`.
    - conditionally renders `GlowAnimation` based on Settings.

#### Chat Stream Hook (`src/hooks/useChatStream.ts`)
- **Responsibility**: Encapsulate complex streaming logic.
- **Flow**:
    1.  **Send**: `fetch` POST to `/chat`.
    2.  **Process Stream**: `response.body.getReader()` reads chunked bytes -> `TextDecoder` decodes to string.
    3.  **Update State**: Appends chunks to current message in real-time.
    4.  **Auto-Title**: triggers title generation for new conversations.
