# cf_ai_study_sprint_coach
Optional Assignment for the Cloudfare SWE position
Study Sprint Coach is an AI-powered chat (and optional voice-input) app built on Cloudflare:
- **Workers AI (Llama 3.3)** for LLM responses
- **Durable Objects** for per-session memory/state (goal + conversation history + rolling summary)
- **Cloudflare Pages** for the frontend UI (chat + microphone button)
- **Worker** API routes each session to a Durable Object instance

## Demo (optional but recommended)
- Deployed Pages: <PASTE_YOUR_PAGES_URL_HERE>
- Deployed Worker API: <PASTE_YOUR_WORKER_URL_HERE>

## Requirements Coverage
LLM: Workers AI (Llama 3.3)
Workflow/coordination: Worker routes each `session` to a Durable Object (1 DO per session)
User input: Cloudflare Pages chat UI + optional voice input
Memory/state: Durable Object durable storage (goal + history + rolling summary)

## Architecture
- `pages/public/` — static frontend (HTML/JS/CSS)
- `worker/src/index.ts` — Worker router exposes `POST /api/chat?session=<id>`
- `worker/src/chat-room-do.ts` — Durable Object stores memory and calls Workers AI

## Local Development

### Prereqs
- Node.js 18+
- Wrangler: `npm i -g wrangler`
- Login: `wrangler login`

### 1 Run the Worker (API + Durable Object)
```bash
cd worker
npm install
wrangler dev
