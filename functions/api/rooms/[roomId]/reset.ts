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

  room.revealed = false;
  for (const id of Object.keys(room.participants)) {
    room.participants[id].vote = null;
  }

  await env.ROOMS.put(roomId, JSON.stringify(room), { expirationTtl: 86400 });

  return Response.json({ ok: true });
};
