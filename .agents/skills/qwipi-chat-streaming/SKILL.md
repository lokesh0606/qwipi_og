---
name: qwipi-chat-streaming
description: >-
  Inspect, debug, and modify the multi-turn LLM streaming pipeline connecting FastAPI,
  Groq LPU inference, and the React 19 frontend useChatStream hook. Use when editing chat
  functionality, message protocols, or title generation.
---

# Qwipi Chat Streaming Skill

## When to Use This Skill
Use this skill when modifying the message lifecycle, conversational streaming, SSE protocols, error handling during generation, or real-time title auto-generation & multi-turn adaptation.

## Streaming Architecture

```
User Prompt (ChatInput.tsx)
      │
      ├─► Optimistic Local Renaming: If new chat, immediately sets sidebar title to prompt.slice(0, 28) + '...'
      ├─► Optimistic Message Append: Adds user prompt to messages array
      │
      ├─► Stream A: HTTP POST /chat (prompt, conversation_id?) [Authorization: Bearer <token>]
      │     FastAPI (backend/api.py)
      │       ├── 1. Get/create Conversation (scoped to current_user.id)
      │       ├── 2. Save User Message in DB
      │       ├── 3. Load last 20 messages as conversational history
      │       ├── 4. GroqProvider.client(formatted_messages)
      │       └── 5. StreamingResponse(generate(), media_type="text/plain", headers={"X-Conversation-Id": id})
      │           │
      │           ▼ Raw text chunks over HTTP stream
      │         useChatStream.ts (TextDecoder reads chunks, streams into MessageBubble)
      │         FastAPI finally block (Commits Assistant Message to DB)
      │
      └─► Stream B: Parallel HTTP POST /chat/title-stream (conversation_id) [Triggered during turns 1–3]
            FastAPI (backend/api.py)
              ├── 1. Query conversation messages (scoped to current_user.id, last 6 messages)
              ├── 2. GroqProvider.generate_title_stream(messages, max_tokens=200)
              └── 3. StreamingResponse(generate_title(), media_type="text/plain")
                  │
                  ▼ Raw title chunks
                useChatStream.ts (Pulsing blue glowing dot active; typewriter replaces optimistic title)
                FastAPI generator completion (Commits final title to PostgreSQL via isolated session)
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

4. **Dynamic Title Adaptation Window**:
   - Title generation triggers on Turn 1 (new conversation), Turn 2, and Turn 3 (`messages.length <= 5`).
   - Starting from Turn 4, the title stabilizes and is no longer re-generated.
   - While streaming, `streamingTitleConvId` is set, causing `Sidebar.tsx` to render a pulsing glowing blue dot indicator.
   - Background `fetchConversations()` calls must never overwrite in-flight titles while `streamingTitleConvIdRef.current` matches the conversation ID.
