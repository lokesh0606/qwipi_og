---
name: qwipi-chat-streaming
description: >-
  Inspect, debug, and modify the multi-turn LLM streaming pipeline connecting FastAPI,
  Groq LPU inference, and the React 19 frontend useChatStream hook. Use when editing chat
  functionality, message protocols, or title generation.
---

# Qwipi Chat Streaming Skill

## When to Use This Skill
Use this skill when modifying the message lifecycle, conversational streaming, SSE protocols, error handling during generation, or title auto-generation.

## Streaming Architecture

```
User Prompt (ChatInput.tsx)
      │
      ▼
useChatStream.ts (Optimistic append to `messages`)
      │
      ▼ HTTP POST /chat (prompt, conversation_id?) [Authorization: Bearer <token>]
      │
FastAPI (backend/api.py)
  ├── 1. Get/create Conversation (scoped to current_user.id)
  ├── 2. Save User Message in DB
  ├── 3. Load last 20 messages as conversational history
  ├── 4. GroqProvider.client(formatted_messages)
  └── 5. StreamingResponse(generate(), media_type="text/plain", headers={"X-Conversation-Id": id})
      │
      ▼ Raw text chunks over HTTP stream
      │
useChatStream.ts (TextDecoder reads chunks, streams into MessageBubble)
      │
FastAPI finally block (Commits Assistant Message to DB)
      │
Title Generation (POST /chat/title-stream invoked asynchronously to update conversation title)
```

## Critical Constraints & Invariants

1. **Text vs JSON Streaming**:
   - Backend yields raw UTF-8 string chunks.
   - Frontend reads via `new TextDecoder().decode(value, { stream: true })`.
   - **Do NOT** wrap chunks into JSON envelopes without updating `useChatStream.ts`.

2. **Conversation ID Handshake**:
   - For new conversations, `conversation_id` is created on the backend and returned in response header `X-Conversation-Id`.
   - The frontend reads `res.headers.get('X-Conversation-Id')` to update active conversation state.

3. **Message Persistence Resilience**:
   - Even if the user disconnects or an exception occurs mid-stream, the assistant message accumulated up to that point is saved in PostgreSQL in the `finally` block of `generate()`.
