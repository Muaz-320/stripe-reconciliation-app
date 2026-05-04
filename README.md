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

## Deploy on Vercel

The static build alone does **not** run `server.ts`. Login and APIs need configuration:

1. **Environment variables** (Project → Settings → Environment Variables):
   - **`ADMIN_USERNAME`** — admin login username  
   - **`ADMIN_PASSWORD`** — admin login password  
   - **`VITE_SAME_ORIGIN_API`** = `true` — makes the browser call `https://<your-app>.vercel.app/api/...` instead of the default external reconciliation API (otherwise **`/api/admin/login` goes to another host** and returns **401** for portal credentials).

2. **`api/admin/login.ts`** — Vercel Serverless route for `POST /api/admin/login`.

3. **`vercel.json`** — rewrites `/api/StripeDbReconciliation/*` to the Dynamic Pricing reconciliation API so manual runs and reports still work on the same domain.

Redeploy after changing env vars (they are baked into the client build for `VITE_*`).
