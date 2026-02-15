# PROMPTS.md

This document contains my use of AI in prompts that I usde during the development of the Study Sprint Coach application.
---

## 1. System Architecture Design
Prompt:
"Design a Cloudflare-native AI application that uses Workers AI, Durable Objects for per-session memory, and a Pages frontend for chat interaction."

Purpose:
Used to outline the high-level architecture including:
- Worker API layer
- Durable Object per-session memory
- Pages static frontend
- Workers AI integration

Result:
Defined the Browser → Worker → Durable Object → Workers AI architecture.

---
## 2. Durable Object Session Memory

Prompt:
"Write a Durable Object class that stores per-session chat history and a goal field, and persists state in memory for the duration of the instance."

Purpose:
To structure:
- Goal storage
- Chat history array
- Request routing via session ID

Result:
Implemented ChatRoomDO class with isolated per-session memory.

---
## 3. Workers AI Integration

Prompt:
"Show how to call Llama 3.3 using the Workers AI binding inside a Cloudflare Worker and pass conversation history."

Purpose:
To correctly structure:
- AI binding usage
- Prompt formatting
- JSON parsing of model output

Result:
Integrated Workers AI binding and formatted conversation history for contextual responses.

---
## 4. SQLite-backed Durable Object Migration

Prompt:
"How do I configure Durable Objects on the Cloudflare free plan using new_sqlite_classes migrations?"

Purpose:
Resolve deployment error related to Durable Object namespace requirements.

Result:
Updated wrangler.jsonc to use:

"migrations": [
  { "tag": "v2", "new_sqlite_classes": ["ChatRoomDO"] }
]

---
## 5. Pages Deployment Configuration

Prompt:
"What is the correct build output directory for a static Cloudflare Pages project when frontend files are located in Pages/Public?"

Purpose:
Fix deployment issue where Pages returned 404.

Result:
Configured Pages build output directory as:
Pages/Public

---
## 6. Case Sensitivity Bug

Prompt:
"Why does my Cloudflare Pages deployment return not found even though it works locally?"

Purpose:
Diagnose Linux case sensitivity issue.

Result:
Renamed index.HTML → index.html to fix production routing.

---
## 7. CORS Handling

Prompt:
"How should I structure CORS headers in a Cloudflare Worker for frontend API calls?"

Purpose:
Ensure frontend could call Worker API without cross-origin errors.

Result:
Implemented reusable corsHeaders() function in index.ts.

---
## AI Usage

AI assistance was used to:
- Accelerate Cloudflare-specific infrastructure setup
- Debug platform-specific deployment issues
- Validate architectural decisions

* All integration, deployment configuration, and debugging steps were reviewed and validated manually.
