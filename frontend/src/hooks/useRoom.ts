import { useState, useEffect } from "react";
import type { RoomState } from "../types";

export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    let ws: WebSocket | null = null;
    let cancelled = false;
    let retryDelay = 1000;
    let retryTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (cancelled) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${window.location.host}/api/rooms/${roomId}`);

      ws.onmessage = (e) => {
        if (!cancelled) {
          setRoom(JSON.parse(e.data));
          setError(null);
          retryDelay = 1000; // reset backoff on successful message
        }
      };

      ws.onerror = () => {
        if (!cancelled) setError("Connection lost. Reconnecting…");
      };

      ws.onclose = () => {
        ws = null;
        if (!cancelled) {
          retryTimer = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 2, 10000);
            connect();
          }, retryDelay);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      ws?.close();
    };
  }, [roomId]);

  return { room, error };
}
