# Ultimate Planning Poker Tool

Sprint planning poker for small teams. Built on Cloudflare Workers + Durable Objects. Free to host.

## Features

- **Create & share rooms** — one click to create, shareable URL to invite the team
- **Anonymous voting** — cards stay hidden until reveal; vote values never sent over the wire until revealed
- **Planning poker deck** — `0, 0.5, 1, 2, 3, 5, 8, 13, 21, ?, ☕`
- **Real-time updates** — WebSocket push; all clients update instantly on every action
- **Anyone can reveal** — no designated facilitator required; reveal button enabled once at least one vote is cast
- **Anyone can reset** — start the next story with one click, all votes cleared
- **Vote stats** — average, median, most picked (handles ties), and a consensus indicator after reveal
- **Consensus messages** — personality-driven labels (robotic, corporate BS, overly friendly, doomer, medieval…) seeded from the votes so everyone sees the same one
- **11 themes** — Midnight, Solarized, Solarized Dark, Catppuccin, Dracula, Nord, Trading, Matrix, Sunset, Cyberpunk, Coffee; persisted in `localStorage`
- **No login** — identity via `localStorage` (name + clientId per room)
- **$0/month** — comfortably within Cloudflare's free Workers + Durable Objects tier for a team of ~10

## Stack

- **Frontend:** React + Vite
- **API:** Cloudflare Worker (`_worker.js` Advanced Mode)
- **State:** Cloudflare Durable Objects — single instance per room, strongly consistent, persistent storage
- **Real-time:** WebSocket — server pushes masked state to all clients on every mutation

## Local Development

### 1. Install dependencies

```bash
npm install          # root (esbuild for worker bundling)
cd frontend && npm install
```

### 2. Terminal 1 — Vite dev server (HMR on :5173)

```bash
cd frontend && npm run dev
```

### 3. Terminal 2 — Wrangler Worker + Durable Objects (:8788)

```bash
npm run dev:worker
```

Open http://localhost:5173. API and WebSocket calls are proxied to :8788.

> If you change worker code, restart Terminal 2.

## Deploy

```bash
npm run deploy
```

The first deploy automatically creates the Durable Object namespace (defined in `wrangler.toml`). No Cloudflare dashboard setup needed.

## Project structure

```
sprint-planning/
├── wrangler.toml              # Worker config + DO binding (class_name = "RoomDO")
├── shared/types.ts            # RoomState, Participant, CARD_VALUES (shared with worker)
├── worker/
│   ├── index.ts               # Worker entry: routes /api/rooms/:id → DO, rest → static assets
│   └── room-do.ts             # RoomDO: WebSocket sessions + join/vote/reveal/reset handlers
└── frontend/
    ├── src/
    │   ├── types.ts               # Inlined RoomState + CARD_VALUES (for Vite/frontend)
    │   ├── api.ts                 # HTTP mutation wrappers (join, vote, reveal, reset)
    │   ├── themes.ts              # 11 theme definitions
    │   ├── consensusLabels.ts     # Seeded deterministic consensus label picker
    │   ├── hooks/useRoom.ts       # WebSocket hook with exponential backoff reconnect
    │   ├── components/
    │   │   └── ThemeSelector.tsx
    │   └── pages/
    │       ├── Home.tsx
    │       └── Room.tsx
    └── vite.config.ts             # Proxy /api → :8788 (HTTP + WebSocket)
```

## How it works

Each room is a single Durable Object instance. When a client connects via WebSocket, the DO immediately sends the current masked state. On any mutation (join/vote/reveal/reset), the DO saves to its storage and broadcasts updated state to all connected WebSocket clients. Vote values are masked as `"hidden"` until revealed, so they never reach other clients before reveal.

Mutations go via HTTP POST; there are no client→server WebSocket messages.
