import { useState, useEffect } from "react";
import { getRoom } from "../api";
import type { RoomState } from "../types";

export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await getRoom(roomId);
        if (!cancelled) {
          setRoom(data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Room not found or connection lost");
      }
    };

    poll();
    const id = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [roomId]);

  return { room, error };
}
