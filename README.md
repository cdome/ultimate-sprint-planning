# Planning Poker

Sprint planning poker for small teams. Built on Cloudflare Pages + Workers + KV.

## Stack

- **Frontend:** React + Vite on Cloudflare Pages
- **API:** Cloudflare Pages Functions (TypeScript)
- **State:** Cloudflare KV (polling every 1.5s, 24hr TTL)

## Local Development

### 1. One-time setup: create KV namespaces

```bash
npx wrangler kv namespace create ROOMS
npx wrangler kv namespace create ROOMS --preview
```

Copy the returned IDs into `wrangler.toml`.

### 2. Build frontend in watch mode (terminal 1)

```bash
cd frontend && npm run dev
```

This starts Vite on http://localhost:5173 with the API proxied to port 8788.

### 3. Run Wrangler Pages dev (terminal 2)

```bash
npm run dev:worker
```

This starts the Pages Functions + KV at http://localhost:8788.

Open http://localhost:5173.

## Deploy

```bash
# First deploy: create the project in Cloudflare Pages dashboard, then:
npm run deploy

# Subsequent deploys:
npm run deploy
```

After the first deploy, go to Cloudflare Pages → your project → Settings → Variables → KV Namespace Bindings, and bind `ROOMS` to your production KV namespace.

## How it works

1. Create a room → get a shareable URL
2. Share the URL with your team
3. Everyone joins with their name
4. Pick a card (hidden from others until revealed)
5. Facilitator (room creator) reveals all votes simultaneously
6. Facilitator resets for the next story

The room creator is the facilitator. `facilitatorId` is stored in `localStorage`.
