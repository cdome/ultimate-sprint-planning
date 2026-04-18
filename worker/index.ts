import { RoomDO } from "./room-do";
import { AdminDO } from "./admin-do";

// Re-export so Cloudflare Pages can find the DO classes in _worker.js
export { RoomDO, AdminDO };

interface DurableObjectId {
  toString(): string;
  name?: string;
}

interface Env {
  ROOMS: {
    idFromName(name: string): DurableObjectId;
    idFromString(hexId: string): DurableObjectId;
    get(id: DurableObjectId): { fetch(req: Request): Promise<Response> };
  };
  ADMIN: {
    idFromName(name: string): DurableObjectId;
    get(id: DurableObjectId): { fetch(req: Request): Promise<Response> };
  };
  ASSETS: { fetch(req: Request | string): Promise<Response> };
  // Optional: set these to enable full listing via Cloudflare REST API
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  ROOMS_NAMESPACE_ID?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

function adminStub(env: Env) {
  return env.ADMIN.get(env.ADMIN.idFromName("global"));
}

/** Fetch all DO hex IDs from the Cloudflare REST API (handles pagination). */
async function fetchAllHexIds(env: Env): Promise<string[]> {
  const hexIds: string[] = [];
  let cursor: string | undefined;
  do {
    const params = new URLSearchParams({ per_page: "100" });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/durable_objects/namespaces/${env.ROOMS_NAMESPACE_ID}/objects?${params}`,
      { headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` } }
    );
    if (!res.ok) throw new Error(`CF API ${res.status}: ${await res.text()}`);
    const data = await res.json<{
      result: Array<{ id: string; hasStoredData?: boolean }>;
      result_info: { cursor?: string; has_more?: boolean };
    }>();
    for (const obj of data.result) {
      if (obj.hasStoredData !== false) hexIds.push(obj.id);
    }
    cursor = data.result_info.has_more ? data.result_info.cursor : undefined;
  } while (cursor);
  return hexIds;
}

/** List rooms using Cloudflare REST API — enumerates all DOs including pre-registry ones. */
async function listRoomsViaAPI(env: Env) {
  const hexIds = await fetchAllHexIds(env);
  const rooms = await Promise.all(
    hexIds.map(async (hexId) => {
      const stub = env.ROOMS.get(env.ROOMS.idFromString(hexId));
      try {
        const res = await stub.fetch(new Request("https://internal/state"));
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    })
  );
  return Response.json(rooms.filter(Boolean));
}

/** List rooms using AdminDO registry — only rooms seen since AdminDO was deployed. */
async function listRoomsViaRegistry(env: Env) {
  const listRes = await adminStub(env).fetch(new Request("https://internal/"));
  const { roomIds } = await listRes.json<{ roomIds: string[] }>();
  const rooms = await Promise.all(
    roomIds.map(async (roomId) => {
      const stub = env.ROOMS.get(env.ROOMS.idFromName(roomId));
      try {
        const res = await stub.fetch(new Request(`https://internal/api/rooms/${roomId}`));
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    })
  );
  return Response.json(rooms.filter(Boolean));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Admin: list all rooms
    if (url.pathname === "/api/admin/rooms" && request.method === "GET") {
      const hasCFCreds = env.CF_API_TOKEN && env.CF_ACCOUNT_ID && env.ROOMS_NAMESPACE_ID;
      return hasCFCreds ? listRoomsViaAPI(env) : listRoomsViaRegistry(env);
    }

    // Admin: delete a room
    const adminDeleteMatch = url.pathname.match(/^\/api\/admin\/rooms\/([^/]+)$/);
    if (adminDeleteMatch && request.method === "DELETE") {
      const roomId = adminDeleteMatch[1];
      await Promise.all([
        adminStub(env).fetch(new Request(`https://internal/${roomId}`, { method: "DELETE" })),
        env.ROOMS.get(env.ROOMS.idFromName(roomId)).fetch(
          new Request(`https://internal/api/rooms/${roomId}`, { method: "DELETE" })
        ),
      ]);
      return Response.json({ ok: true });
    }

    // Route all /api/rooms/:roomId[/action] to the Durable Object for that room.
    // Everything else (frontend assets) is served by the Pages ASSETS binding.
    const match = url.pathname.match(/^\/api\/rooms\/([^/]+)/);
    if (match) {
      const roomId = match[1];
      const stub = env.ROOMS.get(env.ROOMS.idFromName(roomId));
      // Register room in the admin registry (background, non-blocking)
      ctx.waitUntil(
        adminStub(env).fetch(
          new Request("https://internal/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId }),
          })
        )
      );
      // Forward the original request intact — preserves Upgrade header for WebSocket
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
