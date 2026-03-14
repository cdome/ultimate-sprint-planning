import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../api";

export function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { roomId, facilitatorId } = await createRoom();
      localStorage.setItem(`facilitator_${roomId}`, facilitatorId);
      navigate(`/room/${roomId}`);
    } catch {
      setError("Failed to create room. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <p>Create a room and share the link with your team.</p>
      <button onClick={handleCreate} disabled={loading}>
        {loading ? "Creating..." : "Create Room"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
