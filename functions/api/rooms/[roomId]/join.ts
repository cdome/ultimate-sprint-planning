import type { RoomState } from "../../../../shared/types";

interface Env {
  ROOMS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ params, env, request }) => {
  const roomId = params.roomId as string;
  const { clientId, name } = await request.json<{ clientId: string; name: string }>();

  if (!clientId || !name?.trim()) {
    return Response.json({ error: "clientId and name are required" }, { status: 400 });
  }

  const raw = await env.ROOMS.get(roomId);
  if (!raw) {
    return Response.json({ error: "Room not found" }, { status: 404 });
  }

  const room: RoomState = JSON.parse(raw);

  // Idempotent: preserve existing vote if already in room
  room.participants[clientId] = {
    name: name.trim(),
    vote: room.participants[clientId]?.vote ?? null,
  };

  await env.ROOMS.put(roomId, JSON.stringify(room), { expirationTtl: 86400 });

  return Response.json({ ok: true });
};
