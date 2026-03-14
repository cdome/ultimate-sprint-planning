import type { RoomState } from "../../../shared/types";

interface Env {
  ROOMS: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  const roomId = crypto.randomUUID().slice(0, 8);
  const facilitatorId = crypto.randomUUID();

  const room: RoomState = {
    roomId,
    facilitatorId,
    participants: {},
    revealed: false,
    createdAt: Date.now(),
  };

  await env.ROOMS.put(roomId, JSON.stringify(room), { expirationTtl: 86400 });

  return Response.json({ roomId, facilitatorId });
};
