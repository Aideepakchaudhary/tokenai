# ChainMate

AI-powered token analytics and wallet insights. React (Vite + TS) frontend with serverless APIs on Vercel.

## Live App

- https://chainmate-kappa.vercel.app/

## Tech Stack

- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui
- Serverless functions (Vercel) under `api/`
- LangChain + OpenAI for chat/agent
- Optional local dev API via Express (see `server/`)

## Project Structure

```
├── api/                    # Serverless functions (Vercel)
│   ├── chat.ts             # AI chat endpoint (requires OPENAI_API_KEY)
│   ├── portfolio.ts        # Portfolio analysis (The Graph Token API)
│   ├── whales.ts           # Whale holders via Uniswap subgraph
│   └── health.ts           # Health check
├── server/                 # Local Express API (dev convenience)
│   ├── index.ts            # Runs /api routes locally on :3001
│   └── routes/             # chat, portfolio, whale
├── src/                    # React app
│   ├── components/         # UI + feature components
│   ├── lib/                # utils and AI tools
│   └── pages/              # Landing, Chat, etc.
├── vercel.json             # Vercel build/output settings
├── package.json            # scripts and deps
└── DEPLOYMENT.md           # Detailed deploy guide
```

## How Users Interact

- Landing → “Chat with ChainMate” opens the chat interface.
- Pick a chain (default: Ethereum) and type a question, for example:
  - "Analyze this wallet: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
  - "What’s my portfolio worth?"
  - "Show me UNI whales" (see note below)
- The chat calls `/api/chat`, which invokes tools that query `/api/portfolio` and, for whales, a token holders API.
- Results are streamed back to the chat UI as concise, timestamped messages.

## Notes

- Deployed app: whale analysis (via chat and `/api/whales`) is currently in-progress.
- Whale analysis via chat is being aligned with the serverless route. Until then, use `/api/whales` directly in local development or expect limited whale results from chat.
- For local development, add a Vite proxy or use an absolute API base to avoid `/api/*` 404s during `npm run dev`.

## Usecases

- Single interface: ask questions in plain English and get structured insights.
- Quick portfolio overview: total value, top holdings, diversity score, and health.
- Whale visibility: top holders and concentration indicators (via `/api/whales`).
- Secure key handling: secrets live in serverless functions; the client uses relative `/api` calls.
- Easy hosting: deploy the static app + serverless APIs together on Vercel.

## Requirements

- Node.js 18+
- npm 9+

## Setup

1. Install dependencies

```
npm install
```

2. Create environment file from template

```
cp .env.example .env
```

3. Fill required variables in `.env`:

- OPENAI_API_KEY: for `/api/chat`
- GRAPH_API_KEY: for The Graph Token API (portfolio/whales via Token API endpoints)
- TOKEN_API_BASE_URL: base URL for The Graph Token API (e.g., https://token-api.thegraph.com)

## Scripts

- dev: run frontend and the optional local Express API

```
npm run dev
```

- dev:frontend only

```
npm run dev:frontend
```

- dev:backend only (Express on :3001)

```
npm run dev:backend
```

- build (Vite) / preview

```
npm run build
npm run preview
```

## Local Development Notes

- The React app fetches the chat endpoint via a relative path (`/api/chat`).
- For local API testing with Express, use one of the following:
  - Add a Vite dev proxy to forward `/api/*` to `http://localhost:3001`, or
  - Change the frontend to use an absolute base (e.g., `http://localhost:3001/api`).
- Without the proxy or absolute base, `/api/*` calls will 404 during `npm run dev`.

## API Endpoints (serverless on Vercel)

- GET `/api/health` → basic status JSON
- GET `/api/portfolio?wallet=0x...&chain=ethereum|arbitrum|polygon|optimism|base|bsc`  
  Requires: `GRAPH_API_KEY` and `TOKEN_API_BASE_URL`
- POST `/api/chat` with `{ message: string, chain?: string }`  
  Requires: `OPENAI_API_KEY`
- GET `/api/whales?token=SYMBOL` or `/api/whales?address=0x...&limit=&offset=`  
  Uses Uniswap v3 subgraph (no key required) and filters out invalid data. Note: currently available in local development only; not available on the deployed app.

## App Features — Status

### Working now

- Landing page and navigation (Home, Chat)
- Chat UI posting to `/api/chat` (responds when `OPENAI_API_KEY` is set)
- `/api/health` responds
- `/api/portfolio` returns wallet analysis when `GRAPH_API_KEY` and `TOKEN_API_BASE_URL` are configured
- Whale analysis available in local development; not available on the deployed app

### In progress / known gaps

Enables users to wishlist whales and receive instant notifications whenever those whales make new transactions.

## Deploy (Vercel)

- Project includes `vercel.json`:
  - buildCommand: `npm ci && npm run build`
  - outputDirectory: `dist`
- On first deploy:
  - Import the repo in Vercel
  - Add environment variables: `OPENAI_API_KEY`, `GRAPH_API_KEY`, `TOKEN_API_BASE_URL`
  - Deploy

## Troubleshooting

- 401/403/500 on `/api/portfolio` → check `GRAPH_API_KEY` and `TOKEN_API_BASE_URL`
- 401 on `/api/chat` → check `OPENAI_API_KEY`
- 404 on `/api/*` locally → add a Vite proxy or use an absolute API base
- Sparse whale data → subgraph limits/data quality; try widely used tokens (e.g., UNI, LINK)
