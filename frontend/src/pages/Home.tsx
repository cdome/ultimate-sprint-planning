import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { randomRoomName } from "../roomNames";

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50);
}

export function Home() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(roomName);
    navigate(`/room/${slug || randomRoomName()}`);
  };

  return (
    <div className="home">
      <p>Create a room and share the link with your team.</p>
      <form onSubmit={handleCreate}>
        <input
          placeholder="Room name (optional)"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          maxLength={60}
        />
        <button type="submit">Create Room</button>
      </form>
    </div>
  );
}
