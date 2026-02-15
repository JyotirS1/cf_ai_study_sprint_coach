import { routeChatRoom, ChatRoomDO } from "./chat-room-do";

export interface Env {
  AI: Ai;
  CHAT_ROOMS: DurableObjectNamespace;
}

function corsHeaders(origin: string | null) {
  // For review simplicity, allow all. For production, restrict to your Pages domain.
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (url.pathname === "/api/chat") {
      return routeChatRoom(request, env, origin);
    }

    if (url.pathname === "/health") {
      return new Response("ok", { headers: corsHeaders(origin) });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(origin) });
  },
};
export { ChatRoomDO };
