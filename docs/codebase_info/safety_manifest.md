# Safety Manifest 🛑

> [!CAUTION]
> **No-Fly Zone**: **DO NOT TOUCH** the following files or functions without a comprehensive mitigation plan. These are high-risk areas with significant "Blast Radius".

## ☢️ No-Fly Zone (Critical Infrastructure)

### 1. Backend: `get_db` Dependency
- **File**: `backend/database.py` / `backend/api.py`
- **Risk**: **CRITICAL**
- **Reason**: Controls the lifecycle of the Async Database Session. Modifying this can cause:
    - Connection leaks (too many open files).
    - `DetachedInstanceError` in background tasks.
    - Transaction rollbacks failing silently.
- **Constraint**: Do not change the `yield session` logic. If you need a session in a background task, create a *new* `AsyncSessionLocal()`.

### 2. Frontend: `ChatInterface` State Logic
- **File**: `frontend/src/components/ChatInterface.tsx`
- **Risk**: **HIGH**
- **Reason**: The "God Component" that holds the application synchronization state.
    - **Optimistic UI**: Manually manages message arrays before server confirmation.
    - **Stream Ref**: Uses `useRef` to track `currentConversationId` during an async stream.
- **Consequence**: Breaking this leads to "ghost messages," incorrect chat titles, and UI freezing.

### 3. Backend: `AzureOpenAI` Client
- **File**: `backend/chat.py`
- **Risk**: **MEDIUM**
- **Reason**: Contains "Self-Healing" logic for Azure Endpoints (stripping `/deployments` from URLs).
- **Consequence**: Removing this logic breaks deployment for 50% of enterprise users with standard Azure keys.

---

## 🛡️ Integration Tests Required
If you modify any of the above, you **MUST** manually verify:
1.  **Concurrency**: Start a title generation stream AND a chat response stream simultaneously.
2.  **Persistence**: Reload the page in the middle of a stream.
3.  **Deployment**: Test with an environment variable that *includes* the full Azure resource path.
