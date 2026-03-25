# Babel Party — hosting guide

Two parts ship separately: **the API** (Node server) and **the mobile app** (Expo). Players never need your laptop once both are deployed.

## 1. API (`babel-party-server`)

The server holds **Google Cloud credentials** and exposes `/translate`, `/tts`, `/process`, `/health`, `/analytics`.

### Option A — Render (Docker)

1. Push the repo to GitHub.
2. In [Render](https://render.com): **New → Web Service** and connect the repo (or **Blueprint** if you add `render.yaml` at the repo root — see `babel-party-server/render.yaml`).

**Web Service settings (avoid Ruby auto-detect):**

| Field | Value |
|--------|--------|
| **Root Directory** | `babel-party-server` — *required* if the server lives in that subfolder (typical for this repo). Leave **empty** only if the service files are at the repository root. |
| **Environment** | **Docker** — not Ruby. |
| **Dockerfile path** | `Dockerfile` (default when root is `babel-party-server`). |
| **Build / Start** | For Docker, Render usually needs no custom build or start command (the image `CMD` runs `node index.mjs`). |

**Alternative — Native Node (no Docker):** Environment **Node**, same **Root Directory** `babel-party-server`.

- **Build Command:** `npm install` (or `npm ci` if you want lockfile-only installs).  
  Do **not** paste a path or shell prompt (e.g. wrong: `babel-party-server/ $ yarn`).
- **Start Command:** `npm start` (runs `node index.mjs`).  
  This repo uses **npm** (`package-lock.json`), not Yarn, unless you add Yarn yourself.

3. Set environment variables:
   - `GOOGLE_CLOUD_API_KEY` — secret (dashboard only).
   - `CORS_ORIGIN` — start with `*` for testing; later narrow to your app’s origins if you add a web client.
   - `LOG_ANALYTICS=1` — optional; logs JSON lines for `POST /analytics`.
4. Render assigns **`PORT`** automatically; the app already uses `process.env.PORT`.

### Option B — Fly.io

1. Install [`flyctl`](https://fly.io/docs/hands-on/install-flyctl/).
2. From `babel-party-server`: `fly launch` (reuse `Dockerfile` + `fly.toml`).
3. `fly secrets set GOOGLE_CLOUD_API_KEY=...`
4. Fly sets **`PORT`** to match `internal_port` in `fly.toml` (default **8080**).

### Option C — Google Cloud Run

1. Build and push the same Docker image to Artifact Registry.
2. Deploy a Cloud Run service; set `GOOGLE_CLOUD_API_KEY` as a secret env var.
3. Allow unauthenticated invoke for a public API, or add auth later.

### Option D — Railway

1. New project → deploy from GitHub, root `babel-party-server`.
2. Add variable `GOOGLE_CLOUD_API_KEY`; Railway sets `PORT`.

### After deploy

- Open `https://YOUR_HOST/health` — expect `{ "ok": true, ... }`.
- Restrict your **Google API key**: enable only Translation, Speech-to-Text, Text-to-Speech; prefer **IP / referrer** restrictions where the platform documents outbound IPs.

---

## 2. Mobile app (`babel-party`)

Expo apps are **not** hosted like a website for store builds. Typical flow:

1. **EAS Build** (Expo Application Services) produces `.ipa` / `.aab`.
2. **TestFlight / Play internal testing** for testers.
3. **App Store / Play Store** for production.

### Point the app at the hosted API

Set at build time (embedded in the JS bundle):

```bash
EXPO_PUBLIC_PIPELINE_URL=https://YOUR_API_HOST eas build --platform ios --profile production
```

Or define **`EXPO_PUBLIC_PIPELINE_URL`** in the [EAS Environment Variables](https://docs.expo.dev/eas/environment-variables/) UI for the `production` profile (recommended — no secrets to Google in the client; this is only your **public** API base URL).

Optional:

- `EXPO_PUBLIC_USE_GOOGLE_TTS=1` — server-side TTS (uses quota).
- `EXPO_PUBLIC_DISABLE_ANALYTICS=1` — stop sending `POST /analytics`.

Local dev keeps using `babel-party/.env` with the same variable names.

### OTA updates

After launch, use **EAS Update** to ship JS/asset changes without a full store review (within [Expo’s guidelines](https://docs.expo.dev/eas-update/introduction/)).

---

## 3. Roadmap alignment (PRD)

| Phase | Status |
|-------|--------|
| 3–4 Echo Translator, multi-round, scoreboard | In app |
| 5 Analytics | Client → `/analytics` when API URL set + `LOG_ANALYTICS=1` on server |
| 5 Share card | Not built — next polish item |
| 2 DB / Supabase / Firebase | Still optional for shared-device MVP; add when you need rooms across devices |

---

## 4. Security checklist

- [ ] API key only on the server, never in the Expo app.
- [ ] `.env` gitignored (already).
- [ ] Billing budget + alerts on the Google Cloud project.
- [ ] Rotate any key that ever lived in `links` or chat.
