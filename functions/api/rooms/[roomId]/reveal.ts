import type { RoomState } from "../../../../shared/types";

interface Env {
  ROOMS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ params, env }) => {
  const roomId = params.roomId as string;

  const raw = await env.ROOMS.get(roomId);
  if (!raw) {
    return Response.json({ error: "Room not found" }, { status: 404 });
  }

  const room: RoomState = JSON.parse(raw);

  const anyVoted = Object.values(room.participants).some((p) => p.vote !== null);
  if (!anyVoted) {
    return Response.json({ error: "No votes yet" }, { status: 409 });
  }

  room.revealed = true;

  await env.ROOMS.put(roomId, JSON.stringify(room), { expirationTtl: 86400 });

  return Response.json({ ok: true });
};
