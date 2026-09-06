# State & Side Effects

> [!IMPORTANT]
> This document maps "invisible" logic chains—actions that trigger multiple cascading effects across the system.

## ⚡ Action: Sending a Message (`sendMessage`)

When a user presses "Enter" in `ChatInterface.tsx`:

1.  **Optimistic Local Update**:
    - User message added to `messages` array immediately.
    - Input cleared.
    - `isLoading` set to `false`.
    - **Side Effect**: `useEffect` triggers `scrollToBottom()`.

2.  **API Request (`POST /chat`)**:
    - **If New Chat**:
        - Backend creates a new `Conversation` ID.
        - Returns ID in header `X-Conversation-Id`.
        - **Frontend Effect**: `currentConversationId` state is updated.
        - **Sidebar Effect**: A new "New Chat" item is optimistically added to the sidebar list.
        - **Background Effect**: Browser triggers a *secondary request* to `/chat/title-stream` to generate a real title.

3.  **Streaming Response**:
    - Backend yields chunks of text.
    - Frontend `while(true)` loop reads stream.
    - **State Mutation**: The *last message* in the `messages` array is mutated in-place (or replaced) to append the new chunk.

4.  **Completion**:
    - Stream ends.
    - `isLoading` set to `false` (Unlocks input).
    - **DB Effect**: Backend saves the full Assistant message to `messages` table.

## 🔄 Action: Title Generation

Triggered automatically when a new conversation starts.

1.  **Trigger**: `sendMessage` detects `X-Conversation-Id` mismatch (meaning a new chat was created).
2.  **Request**: `POST /chat/title-stream`.
3.  **Stream**: The title is streamed character-by-character (Typewriter effect).
4.  **Global Update**:
    - `conversations` state in `ChatInterface` is updated in real-time.
    - This props down to `Sidebar`, causing the title to animate live in the list.

## 🩸 Global State Dependencies
- **`currentConversationId`**: The "God Variable". Changing this:
    - Triggers `fetchConversations()` (sometimes).
    - Triggers `loadConversation(id)` (if selected from sidebar).
    - Resets `messages` array.

## ⚙️ Action: Updating Settings

When a user toggles a setting in `SettingsModal.tsx`:

1.  **Optimistic Local Update**:
    - `SettingsContext` updates internal state immediately.
    - **Side Effect**: UI (Theme/Model) reflects change instantly.

2.  **Debounced API Request (`PATCH /settings`)**:
    - **Wait**: 500ms delay to prevent spamming.
    - **Race Condition Handling**: `useRef` ensures only the latest request processes.
    - **Result**: Backend DB updated.

3.  **Failure / Rollback**:
    - If API fails, `SettingsContext` reverts to previous state.
    - **UI Effect**: Toast error shown (console log for now).
