import { useState, useEffect } from "react";
import type { RoomState } from "../types";

export function useRoom(roomId: string | null, clientId: string | null = null) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    let ws: WebSocket | null = null;
    let cancelled = false;
    let retryDelay = 1000;
    let retryTimer: ReturnType<typeof setTimeout>;
    let pingTimer: ReturnType<typeof setInterval>;

    const connect = () => {
      if (cancelled) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const query = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
      ws = new WebSocket(`${protocol}//${window.location.host}/api/rooms/${roomId}${query}`);

      pingTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) ws.send("ping");
      }, 15000);

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
        clearInterval(pingTimer);
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
      clearInterval(pingTimer);
      ws?.close();
    };
  }, [roomId]);

  return { room, error };
}
