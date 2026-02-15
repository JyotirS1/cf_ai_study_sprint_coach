import { DurableObject } from "cloudflare:workers";
import type { Env as WorkerEnv } from "./index";

type Role = "system" | "user" | "assistant";
type Msg = { role: Role; content: string };

type ChatRequest = {
  message: string;
  // Optional: allow setting a sprint goal explicitly from UI
  setGoal?: string;
  // Optional: clear memory (useful for reviewers)
  reset?: boolean;
};

type MemoryState = {
  goal: string | null;
  // Rolling summary to keep context small
  summary: string | null;
  // Full recent turns (bounded)
  history: Msg[];
};

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function safeJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function routeChatRoom(
  request: Request,
  env: { CHAT_ROOMS: DurableObjectNamespace },
  origin: string | null
) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session") || "default";

  const id = env.CHAT_ROOMS.idFromName(sessionId);
  const stub = env.CHAT_ROOMS.get(id);

  const forward = new Request(request, { headers: new Headers(request.headers) });
  forward.headers.set("X-Origin", origin ?? "*");

  return stub.fetch(forward);
}

export class ChatRoomDO extends DurableObject<WorkerEnv> {
  private keyState = "state";

  private async loadState(): Promise<MemoryState> {
    const existing = await this.ctx.storage.get<MemoryState>(this.keyState);
    return (
      existing ?? {
        goal: null,
        summary: null,
        history: [],
      }
    );
  }

  private async saveState(state: MemoryState) {
    await this.ctx.storage.put(this.keyState, state);
  }

  private systemPrompt(state: MemoryState) {
    // “Study Sprint Coach” behavior: short, structured, remembers goal + rules.
    const goalLine = state.goal ? `Current sprint goal: ${state.goal}` : "No sprint goal set yet.";
    const summaryLine = state.summary ? `Memory summary: ${state.summary}` : "Memory summary: (none yet).";

    return [
      "You are Study Sprint Coach: a concise, practical assistant for students.",
      "Rules:",
      "- Always respond with a short plan (3–7 steps) and then the answer.",
      "- Ask at most ONE clarifying question only if absolutely needed; otherwise make a reasonable assumption and proceed.",
      "- Prefer concrete next actions, checklists, and small verifiable steps.",
      "- If the user asks to write code, output clean code with brief comments.",
      "",
      goalLine,
      summaryLine,
    ].join("\n");
  }

  private async maybeUpdateSummary(state: MemoryState): Promise<MemoryState> {
    // Summarize occasionally to keep context bounded:
    // if history too long, compress older messages into summary and keep last 12 turns.
    const MAX_TURNS = 24;
    const KEEP_LAST = 12;

    if (state.history.length <= MAX_TURNS) return state;

    const older = state.history.slice(0, state.history.length - KEEP_LAST);
    const recent = state.history.slice(-KEEP_LAST);

    const summarizerMessages: Msg[] = [
      {
        role: "system",
        content:
          "Summarize the following conversation turns into a short memory note (max 6 bullets). Keep only stable facts: goals, constraints, preferences, progress, decisions. Do not include private data. Output bullets only.",
      },
      { role: "user", content: JSON.stringify(older) },
    ];

    const sumResult = await this.env.AI.run(MODEL, { messages: summarizerMessages });
    const summaryText =
      (sumResult as any)?.response ??
      (sumResult as any)?.result ??
      (sumResult as any)?.output ??
      "";

    const mergedSummary = state.summary
      ? `${state.summary}\n${summaryText}`.trim()
      : String(summaryText).trim();

    return {
      ...state,
      summary: mergedSummary || state.summary,
      history: recent,
    };
  }

  async fetch(request: Request): Promise<Response> {
    const origin = request.headers.get("X-Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders(origin) });
    }

    const body = safeJson<ChatRequest>(await request.text());
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "content-type": "application/json" },
      });
    }

    let state = await this.loadState();

    if (body.reset) {
      state = { goal: null, summary: null, history: [] };
      await this.saveState(state);
      return new Response(JSON.stringify({ ok: true, reset: true }), {
        headers: { ...corsHeaders(origin), "content-type": "application/json" },
      });
    }

    if (typeof body.setGoal === "string" && body.setGoal.trim()) {
      state.goal = body.setGoal.trim();
      await this.saveState(state);
    }

    const msg = (body.message ?? "").trim();
    if (!msg) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "content-type": "application/json" },
      });
    }

    // Bound history first (and occasionally summarize)
    state = await this.maybeUpdateSummary(state);

    const messages: Msg[] = [
      { role: "system", content: this.systemPrompt(state) },
      ...state.history.slice(-16),
      { role: "user", content: msg },
    ];

    const result = await this.env.AI.run(MODEL, { messages });

    const assistantText =
      (result as any)?.response ??
      (result as any)?.result ??
      (result as any)?.output ??
      JSON.stringify(result);

    // Save new turn
    state.history = [...state.history, { role: "user", content: msg }, { role: "assistant", content: assistantText }];

    // If user says something like "my goal is ..." set it automatically
    const goalMatch = msg.match(/^(my goal is|goal:)\s*(.+)$/i);
    if (!state.goal && goalMatch?.[2]) {
      state.goal = goalMatch[2].trim();
    }

    await this.saveState(state);

    return new Response(
      JSON.stringify({
        session: this.ctx.id.toString(),
        goal: state.goal,
        answer: assistantText,
      }),
      {
        headers: { ...corsHeaders(origin), "content-type": "application/json" },
      }
    );
  }
}
