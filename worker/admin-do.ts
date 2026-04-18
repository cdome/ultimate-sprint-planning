interface CFStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
}
interface CFState {
  storage: CFStorage;
  blockConcurrencyWhile(fn: () => Promise<void>): void;
}

/** Single global instance — stores the set of all known room IDs. */
export class AdminDO {
  private ctx: CFState;
  private roomIds: Set<string> = new Set();

  constructor(state: CFState) {
    this.ctx = state;
    state.blockConcurrencyWhile(async () => {
      const stored = await state.storage.get<string[]>("roomIds");
      this.roomIds = new Set(stored ?? []);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // GET / → return all room IDs
    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({ roomIds: [...this.roomIds] });
    }

    // POST /register { roomId } → add to set (idempotent)
    if (request.method === "POST" && url.pathname === "/register") {
      const { roomId } = await request.json<{ roomId: string }>();
      if (!this.roomIds.has(roomId)) {
        this.roomIds.add(roomId);
        await this.ctx.storage.put("roomIds", [...this.roomIds]);
      }
      return Response.json({ ok: true });
    }

    // DELETE /:roomId → remove from set
    if (request.method === "DELETE") {
      const roomId = url.pathname.slice(1);
      this.roomIds.delete(roomId);
      await this.ctx.storage.put("roomIds", [...this.roomIds]);
      return Response.json({ ok: true });
    }

    return new Response("Not found", { status: 404 });
  }
}
