import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";
import { joinRoom, castVote, revealVotes, resetVotes } from "../api";
import { CARD_VALUES } from "../types";
import { getConsensusLabel, type ConsensusLevel } from "../consensusLabels";
import { Users, Link2, Eye, RotateCcw, BarChart2, Layers } from "lucide-react";

function getOrCreateClientId(roomId: string): string {
  const key = `client_${roomId}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const [clientId] = useState(() => getOrCreateClientId(roomId!));
  const { room, error } = useRoom(roomId ?? null, clientId);
  // publicId is the ID we appear as in broadcasts — safe to share, useless for forging votes
  const [publicId, setPublicId] = useState<string | null>(
    () => localStorage.getItem(`publicId_${roomId}`)
  );

  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(
    () => localStorage.getItem(`vote_${roomId}`)
  );

  // Re-join on page refresh if we have a name stored
  useEffect(() => {
    if (joined || !room) return;
    const storedName = localStorage.getItem(`name_${roomId}`);
    const storedPublicId = localStorage.getItem(`publicId_${roomId}`);
    if (!storedName) return;
    // If our publicId is already in the room, we're good
    if (storedPublicId && room.participants[storedPublicId]) {
      setPublicId(storedPublicId);
      setJoined(true);
      return;
    }
    // Otherwise rejoin (first load or DO was reset)
    (async () => {
      try {
        const { publicId: pid } = await joinRoom(roomId!, clientId, storedName);
        localStorage.setItem(`publicId_${roomId}`, pid);
        setPublicId(pid);
        setJoined(true);
      } catch {
        localStorage.removeItem(`name_${roomId}`);
        localStorage.removeItem(`publicId_${roomId}`);
      }
    })();
  }, [room, clientId, roomId, joined]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setJoining(true);
    try {
      const { publicId: pid } = await joinRoom(roomId!, clientId, name.trim());
      localStorage.setItem(`name_${roomId}`, name.trim());
      localStorage.setItem(`publicId_${roomId}`, pid);
      setPublicId(pid);
      setJoined(true);
    } finally {
      setJoining(false);
    }
  };

  // Clear local vote when revealed transitions true → false (actual reset)
  const prevRevealed = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (prevRevealed.current === true && room && !room.revealed) {
      setMyVote(null);
      localStorage.removeItem(`vote_${roomId}`);
    }
    if (room) prevRevealed.current = room.revealed;
  }, [room?.revealed]);

  // Clear local vote if server says we haven't voted (e.g., round was reset while offline)
  useEffect(() => {
    if (!room || !publicId) return;
    const participant = room.participants[publicId];
    if (participant && participant.vote === null && myVote !== null) {
      setMyVote(null);
      localStorage.removeItem(`vote_${roomId}`);
    }
  }, [room, publicId]);

  const handleVote = async (card: string) => {
    if (!joined || room?.revealed) return;
    setMyVote(card);
    localStorage.setItem(`vote_${roomId}`, card);
    await castVote(roomId!, clientId, card);
    // WebSocket pushes the updated state to all clients automatically
  };

  const handleReveal = async () => {
    await revealVotes(roomId!);
    // WebSocket pushes revealed state to all clients automatically
  };

  const handleReset = async () => {
    await resetVotes(roomId!);
    // WebSocket pushes reset state to all clients automatically
  };

  if (error) {
    return <div className="room"><p className="error">{error}</p></div>;
  }

  if (!room) {
    return <div className="room"><p>Loading...</p></div>;
  }

  if (!joined) {
    return (
      <div className="room">
        <h2>Join Room</h2>
        <form onSubmit={handleJoin}>
          <input
            autoFocus
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
          />
          <button type="submit" disabled={joining || !name.trim()}>
            {joining ? "Joining..." : "Join"}
          </button>
        </form>
      </div>
    );
  }

  const participantEntries = Object.entries(room.participants); // [publicId, Participant][]
  const participants = participantEntries.map(([, p]) => p);
  const votedCount = participants.filter((p) => p.vote !== null).length;
  const anyVoted = votedCount > 0;

  return (
    <div className="room">
      <header className="room-header">
        <h2>Room: {roomId}</h2>
        <button
          className="copy-btn"
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >
          <Link2 size={14} /> Copy invite link
        </button>
      </header>

      <div className="participants">
        <h3>
          <Users size={13} /> Participants ({votedCount}/{participants.length} voted)
        </h3>
        <ul>
          {participantEntries.map(([pid, p]) => {
            const isMe = pid === publicId;
            return (
              <li key={pid} className={isMe ? "me" : ""}>
                <span className="participant-name">
                  <span className={`presence-dot ${p.online ? "online" : "offline"}`} title={p.online ? "Online" : "Offline"} />
                  {p.name}{isMe ? " (you)" : ""}
                </span>
                <span className={`vote-badge ${p.vote !== null ? "voted" : "waiting"}`}>
                  {room.revealed
                    ? (p.vote ?? "–")
                    : p.vote !== null
                    ? "voted"
                    : "..."}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {!room.revealed && (
        <div className="cards">
          <h3><Layers size={13} /> Your vote{myVote ? `: ${myVote}` : ""}</h3>
          <div className="card-grid">
            {CARD_VALUES.map((card) => (
              <button
                key={card}
                className={`card ${myVote === card ? "selected" : ""}`}
                onClick={() => handleVote(card)}
              >
                {card}
              </button>
            ))}
          </div>
        </div>
      )}

      {room.revealed && (() => {
        const votes = participants.map((p) => p.vote ?? "–");
        const numeric = votes
          .filter((v) => v !== "–" && v !== "?" && v !== "☕")
          .map(Number);
        const avg = numeric.length
          ? numeric.reduce((a, b) => a + b, 0) / numeric.length
          : null;
        const min = numeric.length ? Math.min(...numeric) : null;
        const max = numeric.length ? Math.max(...numeric) : null;
        const sorted = [...numeric].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length
          ? sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
          : null;

        const dist: Record<string, number> = {};
        for (const v of votes) dist[v] = (dist[v] ?? 0) + 1;
        const topCount = Math.max(...Object.values(dist));
        const topVotes = Object.entries(dist)
          .filter(([, count]) => count === topCount)
          .map(([v]) => v)
          .sort((a, b) => CARD_VALUES.indexOf(a) - CARD_VALUES.indexOf(b))
          .join(", ");

        const level: ConsensusLevel =
          max === min ? "perfect" :
          max! - min! <= 2 ? "good" :
          max! - min! <= 5 ? "some" :
          "wide";

        const consensus = getConsensusLabel(level, votes);

        return (
          <div className="results">
            <h3><BarChart2 size={13} /> Results</h3>
            <div className="result-grid">
              {[...participants]
                .sort((a, b) => {
                  const order = [...CARD_VALUES, "–"];
                  return order.indexOf(a.vote ?? "–") - order.indexOf(b.vote ?? "–");
                })
                .map((p, i) => (
                  <div key={i} className="result-card">
                    <span className="result-value">{p.vote ?? "–"}</span>
                  </div>
                ))}
            </div>

            {numeric.length > 0 && (
              <div className="stats">
                <div className="stat">
                  <span className="stat-value">{avg!.toFixed(1)}</span>
                  <span className="stat-label">Average</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{median}</span>
                  <span className="stat-label">Median</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{topVotes}</span>
                  <span className="stat-label">Most picked</span>
                </div>
                <div className={`stat consensus consensus--${level}`}>
                  <span className="stat-value">{consensus}</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {joined && (
        <div className="facilitator-controls">
          {!room.revealed ? (
            <button
              onClick={handleReveal}
              disabled={!anyVoted}
              className="reveal-btn"
            >
              <Eye size={16} /> Reveal votes {votedCount > 0 && `(${votedCount}/${participants.length})`}
            </button>
          ) : (
            <button onClick={handleReset} className="reset-btn">
              <RotateCcw size={16} /> Next story
            </button>
          )}
        </div>
      )}
    </div>
  );
}
