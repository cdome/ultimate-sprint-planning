import type { RoomState, Participant } from "../shared/types";
import { CARD_VALUES } from "../shared/types";

// Minimal Cloudflare Workers type declarations
declare class WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}
interface CFStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
}
interface CFState {
  storage: CFStorage;
  acceptWebSocket(ws: WebSocket, tags?: string[]): void;
  getWebSockets(tag?: string): WebSocket[];
  blockConcurrencyWhile(fn: () => Promise<void>): void;
}

// Internal storage type — participants keyed by clientId, each carrying a publicId.
// publicId is what gets broadcast; clientId is never sent to clients.
interface StoredParticipant extends Participant {
  publicId: string;
}
interface StoredRoom extends Omit<RoomState, "participants"> {
  participants: Record<string, StoredParticipant>; // key = clientId
}

export class RoomDO {
  private ctx: CFState;
  private room: StoredRoom | null = null;

  constructor(state: CFState) {
    this.ctx = state;
    state.blockConcurrencyWhile(async () => {
      this.room = (await state.storage.get<StoredRoom>("room")) ?? null;
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") === "websocket") {
      const clientId = new URL(request.url).searchParams.get("clientId") ?? "";
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1], clientId ? [clientId] : []);
      const room = await this.ensureRoom(request.url);
      // Broadcast to all (including the new socket) so everyone sees updated presence
      this.broadcastOnly(room);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Response(null, { status: 101, webSocket: pair[0] } as any);
    }

    const action = new URL(request.url).pathname.split("/").filter(Boolean).pop();

    if (request.method === "POST") {
      if (action === "join")   return this.handleJoin(request);
      if (action === "vote")   return this.handleVote(request);
      if (action === "reveal") return this.handleReveal();
      if (action === "reset")  return this.handleReset();
    }

    const room = await this.ensureRoom(request.url);
    return Response.json(this.mask(room));
  }

  async webSocketMessage(_ws: WebSocket, _msg: string | ArrayBuffer) {
    if (this.room) this.broadcastOnly(this.room);
  }
  async webSocketClose(_ws: WebSocket) {
    if (this.room) this.broadcastOnly(this.room);
  }
  async webSocketError(_ws: WebSocket) {
    if (this.room) this.broadcastOnly(this.room);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async ensureRoom(requestUrl: string): Promise<StoredRoom> {
    if (this.room) return this.room;
    const segments = new URL(requestUrl).pathname.split("/").filter(Boolean);
    const roomId = segments[2] ?? crypto.randomUUID();
    this.room = {
      roomId,
      facilitatorId: crypto.randomUUID(),
      participants: {},
      revealed: false,
      createdAt: Date.now(),
    };
    await this.ctx.storage.put("room", this.room);
    return this.room;
  }

  /**
   * Convert internal StoredRoom → broadcast-safe RoomState:
   * - participants keyed by publicId (not clientId)
   * - publicId field stripped from each participant value
   * - votes masked when not yet revealed
   */
  private mask(room: StoredRoom): RoomState {
    const participants: Record<string, Participant> = {};
    for (const [clientId, p] of Object.entries(room.participants)) {
      participants[p.publicId] = {
        name: p.name,
        vote: room.revealed ? p.vote : p.vote !== null ? "hidden" : null,
        online: this.ctx.getWebSockets(clientId).length > 0,
      };
    }
    return { ...room, participants };
  }

  private broadcastOnly(room: StoredRoom): void {
    const msg = JSON.stringify(this.mask(room));
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(msg); } catch { /* ignore closed sockets */ }
    }
  }

  private async save(room: StoredRoom): Promise<void> {
    this.room = room;
    await this.ctx.storage.put("room", room);
    this.broadcastOnly(room);
  }

  // ── Request handlers ─────────────────────────────────────────────────────

  private async handleJoin(request: Request): Promise<Response> {
    const { clientId, name } = await request.json<{ clientId: string; name: string }>();
    if (!clientId || !name?.trim()) {
      return Response.json({ error: "clientId and name are required" }, { status: 400 });
    }
    const room = await this.ensureRoom(request.url);
    const existing = room.participants[clientId];
    room.participants[clientId] = {
      name: name.trim(),
      vote: existing?.vote ?? null,
      publicId: existing?.publicId ?? crypto.randomUUID(), // stable across rejoins
    };
    await this.save(room);
    return Response.json({ ok: true, publicId: room.participants[clientId].publicId });
  }

  private async handleVote(request: Request): Promise<Response> {
    const { clientId, vote } = await request.json<{ clientId: string; vote: string }>();
    if (!clientId || !CARD_VALUES.includes(vote)) {
      return Response.json({ error: "Invalid clientId or vote value" }, { status: 400 });
    }
    const room = this.room;
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    if (!room.participants[clientId]) return Response.json({ error: "Not a participant" }, { status: 403 });
    if (room.revealed) return Response.json({ error: "Votes already revealed" }, { status: 409 });
    room.participants[clientId].vote = vote;
    await this.save(room);
    return Response.json({ ok: true });
  }

  private async handleReveal(): Promise<Response> {
    const room = this.room;
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    if (!Object.values(room.participants).some((p) => p.vote !== null)) {
      return Response.json({ error: "No votes yet" }, { status: 409 });
    }
    room.revealed = true;
    await this.save(room);
    return Response.json({ ok: true });
  }

  private async handleReset(): Promise<Response> {
    const room = this.room;
    if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
    room.revealed = false;
    for (const id of Object.keys(room.participants)) {
      room.participants[id].vote = null;
    }
    await this.save(room);
    return Response.json({ ok: true });
  }
}
