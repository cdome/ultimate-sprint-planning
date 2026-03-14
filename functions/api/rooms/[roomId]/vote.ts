import type { RoomState } from "../../../../shared/types";
import { CARD_VALUES } from "../../../../shared/types";

interface Env {
  ROOMS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ params, env, request }) => {
  const roomId = params.roomId as string;
  const { clientId, vote } = await request.json<{ clientId: string; vote: string }>();

  if (!clientId || !CARD_VALUES.includes(vote)) {
    return Response.json({ error: "Invalid clientId or vote value" }, { status: 400 });
  }

  const raw = await env.ROOMS.get(roomId);
  if (!raw) {
    return Response.json({ error: "Room not found" }, { status: 404 });
  }

  const room: RoomState = JSON.parse(raw);

  if (!room.participants[clientId]) {
    return Response.json({ error: "Not a participant" }, { status: 403 });
  }

  if (room.revealed) {
    return Response.json({ error: "Votes already revealed" }, { status: 409 });
  }

  room.participants[clientId].vote = vote;

  await env.ROOMS.put(roomId, JSON.stringify(room), { expirationTtl: 86400 });

  return Response.json({ ok: true });
};
