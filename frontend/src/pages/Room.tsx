import { useState, useEffect } from "react";
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
  const { room, error } = useRoom(roomId ?? null);

  const [clientId] = useState(() => getOrCreateClientId(roomId!));

  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [consensusLabel, setConsensusLabel] = useState<string | null>(null);

  // Re-join on page refresh if we have a name stored
  useEffect(() => {
    const storedName = localStorage.getItem(`name_${roomId}`);
    if (storedName && room && !room.participants[clientId]) {
      joinRoom(roomId!, clientId, storedName).catch(() => {});
      setJoined(true);
    } else if (room?.participants[clientId]) {
      setJoined(true);
    }
  }, [room, clientId, roomId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setJoining(true);
    try {
      await joinRoom(roomId!, clientId, name.trim());
      localStorage.setItem(`name_${roomId}`, name.trim());
      setJoined(true);
    } finally {
      setJoining(false);
    }
  };

  // Clear local vote when a new round starts; pick consensus label on reveal
  useEffect(() => {
    if (!room) return;
    if (!room.revealed) {
      setMyVote(null);
      setConsensusLabel(null);
    }
  }, [room?.revealed]);

  const handleVote = async (card: string) => {
    if (!joined || room?.revealed) return;
    setMyVote(card);
    await castVote(roomId!, clientId, card);
  };

  const handleReveal = async () => {
    await revealVotes(roomId!);
  };

  const handleReset = async () => {
    await resetVotes(roomId!);
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

  const participants = Object.values(room.participants);
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
          {participants.map((p, i) => {
            const isMe = Object.entries(room.participants).find(
              ([id]) => id === clientId
            )?.[1] === p;
            return (
              <li key={i} className={isMe ? "me" : ""}>
                <span className="participant-name">{p.name}{isMe ? " (you)" : ""}</span>
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

        // Distribution: count per card value
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

        if (!consensusLabel) setConsensusLabel(getConsensusLabel(level));
        const consensus = consensusLabel ?? "";

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
                    <span className="result-name">{p.name}</span>
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
