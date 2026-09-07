# Qwipi Frontend SPA

> Streaming-first conversational AI interface built with React 19, TypeScript, Vite, Tailwind CSS v4, and Three.js ambient graphics.

---

## 🎨 Technology Stack

- **Framework**: React `19.2.0` + React DOM `19.2.0`
- **Tooling**: Vite (`rolldown-vite` `7.2.5`) with Fast HMR
- **Language**: TypeScript `~5.9.3`
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite` `4.1.17`)
- **3D Visuals**: Three.js `0.181` + `@react-three/fiber` `9.4` + `@react-three/drei` `10.7`
- **UI Motion**: Framer Motion `12.23.24`
- **Markdown**: React Markdown `10.1` + Remark GFM `4.0`
- **Routing**: React Router DOM `7.11`

---

## 🧩 Architecture & Key Components

```text
frontend/src/
├── contexts/
│   ├── AuthContext.tsx       # Manages JWT in localStorage, login, signup, logout
│   ├── SettingsContext.tsx   # Theme (dark/light), model, provider, glow toggle
│   └── BrandingContext.tsx   # Fetches dynamic app name from /api/v1/config/public
│
├── hooks/
│   └── useChatStream.ts      # Multi-turn streaming hook with rAF batching & title generation
│
└── components/
    ├── ChatInterface.tsx     # Central chat container orchestrating layout & streaming
    ├── Sidebar.tsx           # History sidebar, title typewriter & pulsing indicator
    ├── MessageBubble.tsx     # Memoized markdown bubble with syntax highlighting
    ├── Scene.tsx             # Code-split 3D Three.js particle canvas
    ├── GlowAnimation.tsx     # Ambient morphing backdrop lighting
    ├── SettingsModal.tsx     # User preferences & model selection modal
    └── chat/
        ├── ChatHeader.tsx    # Header bar with active model & status
        ├── ChatInput.tsx     # Auto-resizing prompt textarea
        └── MessageList.tsx   # Zero-jitter scroll pinned message list
```

---

## 🌊 Streaming & Performance Mechanics

1. **Dual Parallel Streaming**:
   - `POST /chat`: Streams raw markdown text tokens from Groq LPU inference.
   - `POST /chat/title-stream`: Concurrently streams short title generation during turns 1–3 (`messages.length <= 5`).
2. **Display-Rate Batching (`requestAnimationFrame`)**:
   - High-throughput LLM tokens are buffered and scheduled via `requestAnimationFrame` to match 60Hz/120Hz display refresh rates, preventing React state thrashing.
3. **Zero-Jitter Scroll Pinning**:
   - In `MessageList.tsx`, stream updates pin to bottom via direct DOM assignment (`container.scrollTop = container.scrollHeight`), eliminating animation jitter from overlapping smooth-scroll loops.
4. **Memoized Markdown Rendering**:
   - `MessageBubble.tsx` is memoized via `React.memo` so historical messages are not re-parsed as new tokens arrive.

---

## 🚀 Getting Started

### Prerequisites
Node.js v20+ / v22+

### Installation & Development
```bash
# Install dependencies
npm install

# Start Vite development server (Port 5173)
npm run dev

# Run TypeScript type validation & production build
npm run build

# Run ESLint validation
npm run lint
```

### Environment Configuration
The frontend automatically resolves the backend URL from `VITE_API_BASE_URL` or defaults to `http://localhost:8000`:
```bash
# .env or runtime environment
VITE_API_BASE_URL=http://localhost:8000
```
