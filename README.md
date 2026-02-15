# cf_ai_study_sprint_coach

Cloudflare SWE Optional Assignment  
AI-powered Study Sprint Coach built on Cloudflare.

---

## Live Deployment

Frontend (Cloudflare Pages)  
https://cf-ai-study-sprint-coach.pages.dev/

Backend API (Cloudflare Worker)  
https://cf-ai-study-sprint-coach-worker.jsompalli7.workers.dev

---

## Overview

Study Sprint Coach is an AI-powered productivity assistant that helps students:

- Set study goals
- Generate structured 45-minute sprint plans
- Maintain session memory across conversations
- Stay focused with actionable breakdowns

The system uses Cloudflare-native AI infrastructure and persistent state via Durable Objects.

---

## Architecture

Browser (Cloudflare Pages)  
→ Worker API  
→ Durable Object (per-session memory)  
→ Workers AI (Llama 3.3)

### Components

LLM  
- Workers AI (Llama 3.3)  
- Generates structured sprint plans and guidance  

Workflow / Coordination  
- Cloudflare Worker routes requests  
- Durable Object manages per-session state  

User Input  
- Chat interface via Cloudflare Pages frontend  
- Frontend structured to support voice integration  

Memory / State  
- Durable Objects store:
  - Goal  
  - Conversation history  
  - Rolling summary  

---

## Tech Stack

- Cloudflare Workers  
- Workers AI (Llama 3.3)  
- Durable Objects (SQLite-backed namespace)  
- Cloudflare Pages  
- TypeScript  
- Vanilla JavaScript frontend  

---

## 📂 Project Structure

cf_ai_study_sprint_coach/

Worker/
  src/
    index.ts
    chat-room-do.ts
  wrangler.jsonc
  package.json

Pages/
  Public/
    index.html
    app.js
    styles.css

PROMPTS.md  
README.md  

---

## Local Development

Run Worker locally:

cd Worker  
npm install  
npx wrangler dev  

Run Pages locally (static serve example):

cd Pages/Public  
npx serve .  

---

## Example Usage

User input:

"Set my goal: finish Math 1554 HW 3 tonight. Give me a 45-minute sprint plan."

Response includes:
- Clear sprint breakdown  
- Time-boxed structure  
- Micro-goals  
- Short break suggestion  
- Reflection step  

---

## Notes

- Each session is isolated via Durable Object instance  
- Worker routes requests using the `?session=` parameter  
- LLM calls use Workers AI binding  
- Designed to demonstrate Cloudflare-native AI architecture  

---

## AI Assistance Disclosure

AI-assisted development was used in building this project.  
Prompts used during development are included in PROMPTS.md.

---

## 👤 Author

Jyotir Sompalli  
Georgia Tech Computer Science
