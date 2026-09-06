# Skill: Authentication System

> [!NOTE]
> **Infrastructure Skill**: Defines how Qwipi secures its API and manages user identity.

## 1. Definition
This skill encompasses **JWT (JSON Web Token)** lifecycle, **Password Hashing (Bcrypt)**, and **Frontend API Interceptors**.

## 2. JWT Lifecycle
Qwipi uses stateless JWT authentication.
*   **Generation**: On successful `/auth/login` or `/auth/signup`, the backend generates a JWT containing:
    *   `sub`: User ID
    *   `exp`: Expiration timestamp (default: 60 minutes)
    *   `jti`: Unique Token ID (for blacklisting)
*   **Validation**: Every protected endpoint uses the `get_current_user` dependency to:
    1.  Verify the signature using `SECRET_KEY`.
    2.  Check if the token is expired.
    3.  Check if the `jti` is blacklisted in Redis.

## 3. Frontend Integration (Axios)
The frontend manages auth state in `AuthContext.tsx`.
*   **Storage**: Tokens are stored in `localStorage` under `qwipi_auth_token`.
*   **Interceptors**:
    *   **Request**: Automatically attaches `Authorization: Bearer <token>` to every request if a token exists.
    *   **Response**: Automatically clears local session and redirects to login if the backend returns a `401 Unauthorized` status.

## 4. X-Conversation-Id Header
For the `/chat` endpoint, the system uses a custom header:
*   **Purpose**: Allows the frontend to receive the UUID of a newly created conversation while the response is still streaming.
*   **Logic**: The backend sets `X-Conversation-Id` in the `StreamingResponse` headers.

## 5. Blast Radius (Side-Effect Warnings)
> [!CAUTION]
> **Secret Key Reset**
> Changing the `SECRET_KEY` in `.env` will immediately invalidate all active user sessions globally.

> [!WARNING]
> **Axios Interceptor Order**
> Interceptors are defined in `AuthContext.tsx`. Ensure this context wraps all components that perform API calls, or requests may lack authentication.
