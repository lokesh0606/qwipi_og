# Skill: Data Contracts

> [!NOTE]
> **Integration Skill**: Maps the shape of data as it crosses the boundary between Frontend (TypeScript) and Backend (Python).

## 1. Definition
This skill defines the shared schema requirements for User, Message, and Conversation entities. It serves as the bridge between `pydantic` models and TypeScript `interfaces`.

## 2. Prerequisites (Context)
*   **Sync Required**: `frontend/src/types/index.ts` AND `backend/schemas.py` must match 1:1 for field names.

## 3. Coupling Map (Logic Ties)
| dependency | reason | risk |
| :--- | :--- | :--- |
| `frontend/src/types/index.ts` | Frontend Source | 🔴 **High**: Manual sync required. |
| `backend/schemas.py` | Backend Source | 🔴 **High**: Source of truth for API validation. |
| `backend/models.py` | Database Source | 🟠 **Medium**: Must map upstream to schemas. |

## 4. Blast Radius (Side-Effect Warnings)

> [!CAUTION]
> **Contractual Dependency (Manual Sync)**
> There is NO automatic generation of TS types from Pydantic models.
> *   **Effect**: Renaming a field in `schemas.py` (e.g., `content` -> `text`) without updating `index.ts` will cause the frontend to silently fail or render `undefined`.
> *   **Constraint**: If you edit `schemas.py`, you **MUST** edit `frontend/src/types/index.ts` in the same Task.

> [!WARNING]
> **Nullability Risk**
> TypeScript allows optional fields (e.g., `id?: string` for optimistic UI), but the Backend strict mode requires them for persistence.
> *   **Constraint**: Frontend logic must filter out "pending" messages before attempting operations that require an ID (like Delete).

## 5. Pre-Flight Verification
**Agent Protocol**: Run this check before modifying `schemas.py`.
1.  **Check Frontend Strings**: Search the frontend codebase for the field name you are about to change.
2.  **Verify Nullability**: If you make a field required in Python, does the Frontend always send it?

---

## 🤝 Schema Map

### Conversation
| Interface (TS) | Schema (Pydantic) | Notes |
| :--- | :--- | :--- |
| `id: string` | `id: str` | UUIDv4. |
| `title: string` | `title: str` | Defaults to "New Chat". |
| `updated_at: string` | `updated_at: datetime` | **Fragile**: Date string parsing matches UTC. |

### Message
| Interface (TS) | Schema (Pydantic) | Notes |
| :--- | :--- | :--- |
| `id?: string` | `id: str` | **Mismatch**: TS enables optimistic local state. |
| `role: 'user' \| 'assistant'` | `role: str` | TS is strict union, Py is string. |
| `content: string` | `content: str` | Payload. |

### Settings
| Interface (TS) | Schema (Pydantic) | Notes |
| :--- | :--- | :--- |
| `theme: 'light' \| 'dark' \| 'system'` | `theme: str` | Validated in Pydantic. |
| `model: 'gpt-4' \| 'gpt-3.5-turbo' \| 'claude-3'` | `model: str` | Validated in Pydantic. |
| `enable_glow: boolean` | `enable_glow: bool` | Controls brightness animation. |
| `clear_all_chats?: boolean` | `clear_all_chats: bool` | **Action**: Triggers backend deletion if `true`. |
| `user_id: string` | `user_id: str` | **Singleton**: Defaults to "default" for now. |
