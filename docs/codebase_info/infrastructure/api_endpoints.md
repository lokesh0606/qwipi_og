# API Endpoints

Base URL: `http://localhost:8000`

## 💬 Chat & Messaging

### `POST /chat`
Sends a user message and retrieves a streaming AI response.
- **Body**: `ChatRequest`
    - `prompt`: string (Required)
    - `conversation_id`: string (Optional - null for new chat)
- **Response**: `StreamingResponse` (text/plain)
- **Headers**: `X-Conversation-Id` (UUID of the active conversation)

### `POST /chat/title-stream`
Generates a title for the conversation in real-time.
- **Body**: `TitleGenerationRequest`
    - `conversation_id`: string (Required)
    - `prompt`: string (Optional - override prompt)
- **Response**: `StreamingResponse` (text/plain)

## 🗄️ Conversation Management

### `GET /conversations`
List all historical conversations.
- **Response**: `List[ConversationResponse]`
    - `id`, `title`, `created_at`, `updated_at`

### `GET /conversations/{conversation_id}`
Get full details including message history.
- **Response**: `ConversationDetail`
    - Includes `messages: List[MessageResponse]`

### `DELETE /conversations/{conversation_id}`
Permanently remove a conversation and its messages.
- **Response**: `{"message": "Conversation deleted successfully"}`

## ⚙️ Settings Management

### `GET /settings`
Retrieve the current application settings.
- **Response**: `SettingsResponse`
    - `theme`, `model`, `enable_glow`, `updated_at`

### `PATCH /settings`
Update application settings or trigger data actions.
- **Body**: `SettingsUpdate`
    - `theme`: string (Optional)
    - `model`: string (Optional)
    - `enable_glow`: boolean (Optional)
    - `clear_all_chats`: boolean (Optional - If true, triggers immediate deletion of all conversations)
- **Response**: `SettingsResponse`
