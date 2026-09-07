---
name: qwipi-chat-streaming
description: >-
  Inspect, debug, and modify the multi-turn LLM streaming pipeline connecting FastAPI,
  Groq LPU inference, and the React 19 frontend useChatStream hook. Use when editing chat
  functionality, message protocols, or title generation.
---

# Qwipi Chat Streaming Skill

## When to Use This Skill
Use this skill when modifying the message lifecycle, conversational streaming, SSE/text protocols, error handling during generation, real-time title auto-generation, multi-turn adaptation, or frontend display-rate scheduling.

---

## Streaming Architecture Diagram

```
User Prompt (ChatInput.tsx)
      │
      ├─► Optimistic Local Renaming: If new chat, immediately sets sidebar title to prompt.slice(0, 28) + '...'
      ├─► Optimistic Message Append: Appends user prompt to local messages state
      │
      ├─► Stream A: HTTP POST /chat (prompt, conversation_id?) [Authorization: Bearer <token>]
      │     FastAPI (backend/api.py)
      │       ├── 1. Get/create Conversation (scoped to current_user.id)
      │       ├── 2. Save User Message in DB
      │       ├── 3. Load last 20 messages as conversational history sliding window
      │       ├── 4. GroqProvider.client(formatted_messages)
      │       └── 5. StreamingResponse(generate(), media_type="text/plain", headers={"X-Conversation-Id": id})
      │           │
      │           ▼ Raw text chunks over HTTP stream
      │         useChatStream.ts:
      │           - TextDecoder.decode(value, { stream: true })
      │           - requestAnimationFrame buffer scheduling (60Hz/120Hz display sync)
      │           - Zero-jitter scroll pinning (container.scrollTop = container.scrollHeight)
      │         FastAPI finally block:
      │           - Commits accumulated Assistant Message to PostgreSQL
      │
      └─► Stream B: Parallel HTTP POST /chat/title-stream (conversation_id) [Turns 1–3]
            FastAPI (backend/api.py)
              ├── 1. Query conversation messages (scoped to current_user.id, last 6 messages)
              ├── 2. GroqProvider.generate_title_stream(messages, max_tokens=200)
              └── 3. StreamingResponse(generate_title(), media_type="text/plain")
                  │
                  ▼ Raw title chunks
                useChatStream.ts:
                  - Pulsing blue glowing dot active (streamingTitleConvId === conv.id)
                  - Typewriter delay replaces optimistic title smoothly
                FastAPI completion:
                  - Commits final title to PostgreSQL via isolated AsyncSessionLocal scope
```

---

## Critical Invariants & Implementation Guidelines

### 1. Raw Text Chunk Protocol
- **Backend**: Yields raw UTF-8 string chunks directly from Groq's async stream via `media_type="text/plain"`.
- **Frontend**: Reads via `const chunk = decoder.decode(value, { stream: true })`.
- **Constraint**: Do NOT wrap chunks into JSON envelopes without updating `useChatStream.ts`.

### 2. Display-Rate Batching (`requestAnimationFrame`)
- Micro-token streaming from high-speed LPU inference (100+ tokens/sec) causes React state thrashing if updated per token.
- `useChatStream.ts` buffers incoming chunks and flushes state via `requestAnimationFrame`.
- This synchronizes DOM updates to 60Hz/120Hz display refresh rates.

### 3. Zero-Jitter Scroll Pinning
- In [frontend/src/components/chat/MessageList.tsx](file:///c:/Users/Lokes/OneDrive/Documents/code/qwipi/frontend/src/components/chat/MessageList.tsx):
- Auto-scrolling directly sets `container.scrollTop = container.scrollHeight` on updates.
- Avoid calling `scrollIntoView({ behavior: 'smooth' })` during stream generation; continuous re-triggering of smooth-scroll animations creates severe layout jitter.
- Upward scrolling by the user is detected to preserve reading position without forceful snapping.

### 4. Conversation ID Handshake
- For new conversations, the generated UUID is returned in response header `X-Conversation-Id`.
- The frontend reads `response.headers.get('X-Conversation-Id')` to bind the conversation state and trigger title streaming.

### 5. Message Persistence Resilience
- The assistant message is saved in the `finally` block of `generate()` in `backend/api.py`.
- If the user disconnects or navigates away mid-stream, partial tokens generated up to that point are safely committed to PostgreSQL.

### 6. Dynamic Title Adaptation Window
- Turn 1 (New Chat): Optimistic title set immediately, parallel stream started.
- Turns 2 & 3 (`messages.length <= 5`): Title stream re-evaluates context (last 6 messages) to refine topic as conversation develops.
- Turn 4+: Title permanently stabilizes.
- While streaming, `streamingTitleConvId` renders a pulsing glowing blue dot in `Sidebar.tsx`.
