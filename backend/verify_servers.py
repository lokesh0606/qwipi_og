import urllib.request
import json
import socket
import sys

def check_tcp(host, port):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        s.connect((host, port))
        s.close()
        return True, "Connected"
    except Exception as e:
        return False, str(e)

print("=== 1. DATABASE & CACHE INFRASTRUCTURE ===")
pg_ok, pg_msg = check_tcp("localhost", 5432)
print(f"PostgreSQL (localhost:5432): {'UP' if pg_ok else 'DOWN'} ({pg_msg})")

redis_ok, redis_msg = check_tcp("localhost", 6379)
print(f"Redis (localhost:6379): {'UP' if redis_ok else 'DOWN'} ({redis_msg})")

print("\n=== 2. FRONTEND SERVER ===")
try:
    req = urllib.request.urlopen("http://localhost:5173/", timeout=5)
    print(f"Frontend (http://localhost:5173/): HTTP {req.status} OK (Vite Single Page App ready)")
except Exception as e:
    print(f"Frontend (http://localhost:5173/): FAILED - {e}")

print("\n=== 3. BACKEND PUBLIC ENDPOINTS ===")
endpoints = [
    ("Health Check", "http://localhost:8000/health"),
    ("OpenAPI Docs (Swagger UI)", "http://localhost:8000/docs"),
    ("OpenAPI JSON Specification", "http://localhost:8000/openapi.json"),
    ("Public Branding Configuration", "http://localhost:8000/api/v1/config/public"),
]

for label, url in endpoints:
    try:
        req = urllib.request.urlopen(url, timeout=5)
        body = req.read().decode("utf-8")
        sample = body[:70] + "..." if len(body) > 70 else body
        print(f"{label} ({url}): HTTP {req.status} OK -> {sample.strip()}")
    except Exception as e:
        print(f"{label} ({url}): FAILED - {e}")

print("\n=== 4. AUTH & PROTECTED ENDPOINTS ===")
token = None
try:
    data = json.dumps({"email": "lokeshkanam82@gmail.com", "password": "Password123!"}).encode("utf-8")
    req = urllib.request.Request("http://localhost:8000/auth/login", data=data, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req, timeout=5)
    body = json.loads(res.read().decode("utf-8"))
    token = body.get("access_token")
    print(f"POST /auth/login: HTTP {res.status} OK (Logged in as admin, token obtained)")
except Exception as e:
    print(f"POST /auth/login: FAILED - {e}")

if token:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Check /auth/me
    try:
        req = urllib.request.Request("http://localhost:8000/auth/me", headers=headers)
        res = urllib.request.urlopen(req, timeout=5)
        user = json.loads(res.read().decode("utf-8"))
        print(f"GET /auth/me: HTTP {res.status} OK (email={user.get('email')}, is_admin={user.get('is_admin')})")
    except Exception as e:
        print(f"GET /auth/me: FAILED - {e}")

    # Check /api/v1/models (protected)
    try:
        req = urllib.request.Request("http://localhost:8000/api/v1/models", headers=headers)
        res = urllib.request.urlopen(req, timeout=5)
        models_data = json.loads(res.read().decode("utf-8"))
        print(f"GET /api/v1/models: HTTP {res.status} OK -> {json.dumps(models_data)[:70]}...")
    except Exception as e:
        print(f"GET /api/v1/models: FAILED - {e}")

    # Check /conversations
    try:
        req = urllib.request.Request("http://localhost:8000/conversations", headers=headers)
        res = urllib.request.urlopen(req, timeout=5)
        convs = json.loads(res.read().decode("utf-8"))
        print(f"GET /conversations: HTTP {res.status} OK ({len(convs)} conversations found)")
    except Exception as e:
        print(f"GET /conversations: FAILED - {e}")

    # Check /chat streaming with Groq
    print("\n=== 5. LLM CHAT STREAMING (GROQ API) ===")
    try:
        chat_data = json.dumps({
            "prompt": "Say 'Qwipi system fully operational!' in exactly 4 words.",
            "model": "openai/gpt-oss-120b"
        }).encode("utf-8")
        req = urllib.request.Request("http://localhost:8000/chat", data=chat_data, headers=headers)
        res = urllib.request.urlopen(req, timeout=20)
        print(f"POST /chat: HTTP {res.status} Streaming connection opened!")
        print("Receiving raw stream tokens: \"", end="", flush=True)
        chunks = []
        while True:
            chunk = res.read(64)
            if not chunk:
                break
            chunk_str = chunk.decode("utf-8", errors="replace")
            chunks.append(chunk_str)
            print(chunk_str, end="", flush=True)
        print(f"\"\nStream completed successfully! Total chunks received: {len(chunks)}")
    except Exception as e:
        print(f"\nPOST /chat: FAILED - {e}")
