# Ultimate Planning Poker Tool v2

Sprint planning poker for small teams. Built on Cloudflare Pages + Workers + KV. Free to host.

## Features

- **Create & share rooms** — one click to create, shareable URL to invite the team
- **Anonymous voting** — cards stay hidden until reveal; vote values never sent over the wire until revealed
- **Planning poker deck** — `0, 0.5, 1, 2, 3, 5, 8, 13, 21, ?, ☕`
- **Anyone can reveal** — no designated facilitator required; reveal button enabled once at least one vote is cast
- **Anyone can reset** — start the next story with one click, all votes cleared
- **Vote stats** — average, median, most picked (handles ties), and a consensus indicator after reveal
- **Consensus messages** — randomised personality-driven labels (robotic, corporate BS, overly friendly, doomer, medieval…) seeded from the votes so everyone sees the same one
- **11 themes** — Midnight, Solarized, Solarized Dark, Catppuccin, Dracula, Nord, Trading, Matrix, Sunset, Cyberpunk, Coffee; persisted in `localStorage`
- **Random slogans** — because why not
- **No login** — identity via `localStorage` (name + clientId per room)
- **$0/month** — comfortably within Cloudflare's free KV + Workers tier for a team of ~10, a few sessions per week

## Stack

- **Frontend:** React + Vite → Cloudflare Pages
- **API:** Cloudflare Pages Functions (TypeScript)
- **State:** Cloudflare KV (1.5s polling, 24hr TTL per room)

## Local Development

### 1. One-time setup — create KV namespaces

```bash
npx wrangler kv namespace create ROOMS
npx wrangler kv namespace create ROOMS --preview
```

Paste the returned IDs into `wrangler.toml`.

### 2. Terminal 1 — Vite dev server (HMR on :5173)

```bash
cd frontend && npm run dev
```

### 3. Terminal 2 — Wrangler Pages + KV (:8788)

```bash
npm run dev:worker
```

Open http://localhost:5173. API calls are proxied to :8788.

## Deploy

```bash
npm run deploy
```

On first deploy: go to Cloudflare Pages → your project → Settings → Variables → KV Namespace Bindings and bind `ROOMS` to your production KV namespace.

## Project structure

```
sprint-planning/
├── wrangler.toml                  # Pages config + KV binding
├── shared/types.ts                # Shared types for Pages Functions
├── functions/api/
│   └── rooms/
│       ├── index.ts               # POST /api/rooms — create room
│       └── [roomId]/
│           ├── index.ts           # GET — poll room state (masks votes until reveal)
│           ├── join.ts            # POST — join with a name
│           ├── vote.ts            # POST — cast a vote
│           ├── reveal.ts          # POST — reveal all votes
│           └── reset.ts           # POST — clear votes for next story
└── frontend/
    ├── src/
    │   ├── types.ts               # RoomState, CARD_VALUES
    │   ├── api.ts                 # All fetch calls
    │   ├── themes.ts              # Theme list
    │   ├── consensusLabels.ts     # Randomised consensus messages (seeded, deterministic)
    │   ├── hooks/useRoom.ts       # Polling hook (1.5s interval)
    │   ├── components/
    │   │   └── ThemeSelector.tsx
    │   └── pages/
    │       ├── Home.tsx
    │       └── Room.tsx
    └── vite.config.ts             # Proxy /api → :8788 in dev
```
