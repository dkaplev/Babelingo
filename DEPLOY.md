# Babel Party — hosting guide

**What the game is:** see the repo **[README.md](./README.md)** (modes, solo/party, pipeline, features).

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
   - `GOOGLE_CLOUD_API_KEY` — secret (dashboard only). **Exact name** (all caps, underscores); Render/Linux will not read `Google_Cloud_API_Key` unless you duplicate it. After deploy, open `https://your-service.onrender.com/health` and confirm `"google": true`.
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

The game is a **native mobile app** (mic, TTS, recording). You don’t “host” it like a PHP site on a VPS — you **build installable binaries** with **EAS Build** (cloud or **local on your Mac**), then people install from a link, TestFlight, or the stores. For cloud builds, your laptop is only needed to start the build; **local builds** avoid long free-tier EAS queues.

### One-time setup (from any machine)

Use **`npx`** so you never need a global install (avoids `EACCES` on macOS when `/usr/local/lib/node_modules` is not writable):

```bash
cd Babelingo/babel-party    # or: cd to wherever `babel-party` lives in your clone
npx eas-cli@latest login
npx eas-cli@latest init     # links the folder to an Expo project (adds projectId in app.json if needed)
```

For later commands, same pattern: `npx eas-cli@latest build ...`, `npx eas-cli@latest whoami`, etc.

**If you prefer a global `eas` command:** either fix npm’s global directory (see [npm docs on permission errors](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)) or run `sudo npm install -g eas-cli` (works but is easy to regret long-term).

**`cd: no such file or directory: babel-party`:** you were already inside `babel-party`, or your shell was not at the repo root. From `Cursor_Project_1`, use `cd Babelingo/babel-party` (adjust if your folders differ).

- **Apple:** configure signing in EAS (team, distribution certificate). First iOS build walks you through this.
- **Android:** EAS can create a keystore for you or use your own.

`app.json` already sets **`ios.bundleIdentifier`** and **`android.package`** to `party.babelingo.app` — change both if that id is taken.

### Build installable apps (no Metro, no laptop at the event)

Set **`EXPO_PUBLIC_PIPELINE_URL`** in the [Expo environment variables](https://expo.dev) for the profiles you use (`preview`, `production`), **or** prefix the command:

```bash
EXPO_PUBLIC_PIPELINE_URL=https://YOUR_API_HOST npx eas-cli@latest build --profile preview --platform ios
EXPO_PUBLIC_PIPELINE_URL=https://YOUR_API_HOST npx eas-cli@latest build --profile preview --platform android
```

Open the build on [expo.dev](https://expo.dev): you get an **Install** link (iOS internal/ad hoc per your credentials) or an **APK/AAB** for Android (sideload or Play internal track).

For store release:

```bash
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit -p ios
npx eas-cli@latest submit -p android
```

Typical flow:

1. **EAS Build** produces `.ipa` / `.aab` in the cloud.
2. **Internal / TestFlight / Play internal testing** for friends.
3. **App Store / Play Store** when you’re ready.

### TestFlight without EAS cloud queues (local builds)

Free-tier **cloud** EAS builds can sit in a long queue. Use one of these instead.

#### Option A — EAS **local** iOS build (recommended)

Same **`production`** profile and signing credentials as cloud builds, but the compile runs **on your Mac** — **no queue**.

**One-time on the Mac:**

- Install **Xcode** (App Store) and open it once to accept the license.
- Install **CocoaPods** (`brew install cocoapods` or the [CocoaPods install guide](https://cocoapods.org/)).
- Install **Fastlane** (required by EAS for local iOS builds): `brew install fastlane`.
- `npx eas-cli@latest login` from `babel-party` if you have not already.

**Each TestFlight build:**

1. Set **`EXPO_PUBLIC_PIPELINE_URL`** for `production` in the [EAS env vars](https://expo.dev) UI, **or** prefix the command (same as cloud builds).
2. From `babel-party`:

   ```bash
   npm run build:ios:local
   ```

   Equivalent:

   ```bash
   EXPO_PUBLIC_PIPELINE_URL=https://YOUR_API_HOST npx eas-cli@latest build --platform ios --profile production --local
   ```

3. When the build finishes, you get an **`.ipa`** on disk. Upload to App Store Connect:
   - **Transporter** (Mac App Store), or
   - `npx eas-cli@latest submit -p ios --profile production --path path/to/your.ipa` (if you pass `--path`, submit does not require a prior cloud build).

After a **local** EAS build, submit the `.ipa` without re-uploading from Expo’s servers:

```bash
EAS_SUBMIT_IPA_PATH="$HOME/Downloads/your-build.ipa" npm run submit:ios-testflight
```

Or use **Transporter** or **Xcode Organizer** to upload the `.ipa`.

See Expo’s [local builds](https://docs.expo.dev/build-reference/local-builds/) for troubleshooting.

#### Option B — **Prebuild + Xcode** (no `eas build` at all)

Use this if you prefer full control in Xcode or want zero dependency on EAS for the compile step. **`ios/` is gitignored** in this repo; you regenerate it when native deps change.

1. From `babel-party`, set API URL for the JS bundle (same as other builds):

   ```bash
   export EXPO_PUBLIC_PIPELINE_URL=https://YOUR_API_HOST
   ```

2. Generate native project and install pods:

   ```bash
   npm run prebuild:ios
   cd ios && pod install && cd ..
   ```

3. Open the **`.xcworkspace`** inside **`ios/`** in Xcode (folder name follows `expo.slug` / `expo.name` in `app.json`).
4. Select a **real device** or **Any iOS Device (arm64)**, not a simulator.
5. **Signing & Capabilities:** your **Team** (`UDP2RKPHCF` / Babelingo bundle id `party.babelingo.app`).
6. **Product → Archive** → **Distribute App** → **App Store Connect** → upload.

After processing in App Store Connect, enable **TestFlight** as usual.

### Point the app at the hosted API

Set at build time (embedded in the JS bundle):

```bash
EXPO_PUBLIC_PIPELINE_URL=https://YOUR_API_HOST npx eas-cli@latest build --platform ios --profile production
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
| 5 Share card | Image poster + system share (`react-native-view-shot` + `expo-sharing`) |
| 2 DB / Supabase / Firebase | Still optional for shared-device MVP; add when you need rooms across devices |

---

## 4. Security checklist

- [ ] API key only on the server, never in the Expo app.
- [ ] `.env` gitignored (already).
- [ ] Billing budget + alerts on the Google Cloud project.
- [ ] Rotate any key that ever lived in `links` or chat.
