# stripe-reconciliation-app

Admin portal for manual Stripe–database reconciliation (manual runs, reports, help).

## Run locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set variables as needed (`GEMINI_API_KEY`, optional `VITE_API_BASE_URL` / `API_BASE_URL`).
3. Start dev server (Express + Vite): `npm run dev`
4. Open `http://localhost:3000`

## Scripts

- `npm run dev` — development server with API proxy to the reconciliation backend (unless `USE_LOCAL_API_MOCK=true` in `.env`)
- `npm run build` — production frontend build (`dist/`)
- `npm run preview` — preview production build
