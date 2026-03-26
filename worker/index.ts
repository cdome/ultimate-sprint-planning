import { RoomDO } from "./room-do";

// Re-export so Cloudflare Pages can find the DO class in _worker.js
export { RoomDO };

interface Env {
  ROOMS: {
    idFromName(name: string): object;
    get(id: object): { fetch(req: Request): Promise<Response> };
  };
  ASSETS: { fetch(req: Request | string): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Route all /api/rooms/:roomId[/action] to the Durable Object for that room.
    // Everything else (frontend assets) is served by the Pages ASSETS binding.
    const match = url.pathname.match(/^\/api\/rooms\/([^/]+)/);
    if (match) {
      const roomId = match[1];
      const stub = env.ROOMS.get(env.ROOMS.idFromName(roomId));
      // Forward the original request intact — preserves Upgrade header for WebSocket
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
