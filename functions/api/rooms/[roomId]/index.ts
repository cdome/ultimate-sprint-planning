import type { RoomState, Participant } from "../../../../shared/types";

interface Env {
  ROOMS: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const roomId = params.roomId as string;
  const raw = await env.ROOMS.get(roomId);

  if (!raw) {
    return Response.json({ error: "Room not found" }, { status: 404 });
  }

  const room: RoomState = JSON.parse(raw);

  // Mask vote values until revealed
  if (!room.revealed) {
    const masked: Record<string, Participant> = {};
    for (const [id, p] of Object.entries(room.participants)) {
      masked[id] = { name: p.name, vote: p.vote !== null ? "hidden" : null };
    }
    return Response.json({ ...room, participants: masked });
  }

  return Response.json(room);
};
