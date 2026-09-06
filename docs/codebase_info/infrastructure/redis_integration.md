# Skill: Redis Integration

> [!NOTE]
> **Infrastructure Skill**: Defines how Redis is used for security orchestration and performance.

## 1. Definition
Redis acts as a high-speed volatile storage layer for **Rate Limiting** and **JWT Revocation (Blacklisting)**.

## 2. Rate Limiting (`slowapi`)
Qwipi uses Redis to track request frequencies per IP address.
*   **Implementation**: `slowapi` decorators in `api.py`.
*   **Storage**: Key-value pairs in Redis with automatic TTL (Time-To-Live).
*   **Defaults**:
    *   Signup: 5 per minute
    *   Login: 5 per minute

## 3. Token Blacklisting (Secure Logout)
Since JWTs are stateless, Qwipi implements blacklisting to "invalidate" tokens before they expire.
*   **Logout Flow**:
    1.  User hits `/auth/logout`.
    2.  Backend extracts `jti` and `exp` from the token.
    3.  Backend stores `blacklist:<jti>` in Redis with a TTL matching the token's remaining life.
*   **Verification**: The `get_current_user` dependency checks Redis for every request. If the `jti` exists, the request is rejected with `401`.

## 4. Connectivity & Fallbacks
*   **Backend Client**: `backend/redis_client.py` manages the connection pool.
*   **Resilience**: If Redis is down, the system is designed to fail-safe (allowing requests but losing rate limiting/blacklisting) if configured with try-except blocks, but currently, it is a **hard dependency** for Auth validation.

## 5. Pre-Flight Verification
**Agent Protocol**:
1.  **Check Redis Status**: Ensure the Redis container is running before testing Auth logic.
2.  **Clear Blacklist**: If testing login/logout loops, you may need to clear the Redis database (`FLUSHDB`) to reuse tokens.
