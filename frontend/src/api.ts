import type { RoomState } from "./types";

const BASE = "/api";

export async function createRoom(): Promise<{ roomId: string; facilitatorId: string }> {
  const res = await fetch(`${BASE}/rooms`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create room");
  return res.json();
}

export async function getRoom(roomId: string): Promise<RoomState> {
  const res = await fetch(`${BASE}/rooms/${roomId}`);
  if (!res.ok) throw new Error("Room not found");
  return res.json();
}

export async function joinRoom(roomId: string, clientId: string, name: string): Promise<void> {
  const res = await fetch(`${BASE}/rooms/${roomId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, name }),
  });
  if (!res.ok) throw new Error("Failed to join room");
}

export async function castVote(roomId: string, clientId: string, vote: string): Promise<void> {
  const res = await fetch(`${BASE}/rooms/${roomId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, vote }),
  });
  if (!res.ok) throw new Error("Failed to cast vote");
}

export async function revealVotes(roomId: string): Promise<void> {
  const res = await fetch(`${BASE}/rooms/${roomId}/reveal`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reveal votes");
}

export async function resetVotes(roomId: string): Promise<void> {
  const res = await fetch(`${BASE}/rooms/${roomId}/reset`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset votes");
}
