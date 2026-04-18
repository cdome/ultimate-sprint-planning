import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { RoomState } from "../types";

function formatDate(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function voteCount(participants: RoomState["participants"]): string {
  const all = Object.values(participants);
  const voted = all.filter((p) => p.vote !== null);
  return `${voted.length}/${all.length}`;
}

export function Admin() {
  const [rooms, setRooms] = useState<RoomState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRooms(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(roomId: string) {
    if (!confirm(`Delete room "${roomId}"? This cannot be undone.`)) return;
    setDeleting(roomId);
    try {
      const res = await fetch(`/api/admin/rooms/${roomId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRooms((prev) => prev.filter((r) => r.roomId !== roomId));
    } catch (e) {
      alert(`Failed to delete: ${e}`);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Admin — Rooms</h2>
        <button onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <p className="admin-error">Error: {error}</p>}

      {!loading && rooms.length === 0 && !error && (
        <p className="admin-empty">No rooms found.</p>
      )}

      {rooms.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Room ID</th>
              <th>Participants</th>
              <th>Votes</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => {
              const names = Object.values(room.participants)
                .map((p) => p.name)
                .join(", ");
              return (
                <tr key={room.roomId}>
                  <td>
                    <Link to={`/room/${room.roomId}`}>{room.roomId}</Link>
                  </td>
                  <td title={names}>{Object.keys(room.participants).length}</td>
                  <td>{voteCount(room.participants)}</td>
                  <td>{room.revealed ? "Revealed" : "Voting"}</td>
                  <td>{formatDate(room.createdAt)}</td>
                  <td>{formatDate(room.updatedAt)}</td>
                  <td>
                    <button
                      className="admin-delete-btn"
                      onClick={() => handleDelete(room.roomId)}
                      disabled={deleting === room.roomId}
                    >
                      {deleting === room.roomId ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
