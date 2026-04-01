# Babelingo

**Babelingo** is a **mobile-first party game** (Expo / React Native) where players **hear a phrase**, **try to repeat it**, and **watch the app turn their attempt into English**—often with chaotic, funny results. The joke is not textbook translation; it is **sound, memory, speech recognition, and re-translation** collapsing together.

The same codebase is also described in internal docs as **Babel Party**; this README reflects **what the shipped app does today**.

---

## Who it is for

- Friends in one room with **one shared phone** (pass-the-device play).
- Solo players who want a **short practice round** before hosting.
- Anyone who enjoys **Jackbox-style** social energy and **reveal-driven** comedy.

---

## How a session works (high level)

1. **Pick a game** (Echo Translator, Babel Phone, or Reverse Audio).
2. **Pick a vibe**: **Regular** (curated 7-round climb) or **Mayhem** (random languages each round, phrases never shorter than four words).
3. **Create a room**: **Solo** (one player loop) or **Party** (multiple players, optional teams).
4. **Lobby** → **round intro** → **turns** (listen / record / processing) → **scoreboard** with reveals, then the next round until the session ends.

Full sessions use **seven rounds** by default (`TOTAL_GAME_ROUNDS` in code).

---

## Game modes

### Echo Translator

- Each player gets **real foreign-language audio** for a phrase (English is **not** used as the “foreign” clue—only non-English languages in the pool).
- Players **mimic** what they hear; the pipeline scores the attempt and drives the reveal flow.
- **Listen-speed slider** on the turn screen so players can slow down or speed up the clue audio.
- **Solo**: one turn per round; **Party**: full pass-the-phone order. The **same line** is used across the round where the design calls for it, with **big reveals on the scoreboard** at the end of the round arc.

### Babel Phone

- A **telephone chain**: each turn you hear a line in a **real foreign language**; **English mutates only between turns** on the chain (not as the initial foreign clue).
- **Solo**: a **single hop**—you hear the foreign line once, record once, and see how English drifts on the scoreboard.
- **Party**: **full telephone** order through all players.
- Like Echo, **English is excluded** from the foreign-language pool for the clue audio.

### Reverse Audio

- **English-only** mode: short lines (**about 4–5 words**), **distinct per player** each round.
- Flow: hear a **backward** clue (with a **listen-speed slider** and `expo-av` playback rate), **record a mimic**, the app **reverses** the clip for playback, then the player **says** the line forward.
- **Solo** and **Party** variants are described on the create-room screen (solo is a tight practice loop; party runs the full chain).

Building reversed audio and high-quality STT/TTS typically requires a **deployed pipeline** (see below); the UI surfaces clear hints when the server URL is missing.

---

## Regular vs Mayhem

| | **Regular** | **Mayhem** |
|---|-------------|------------|
| **Languages** | Scripted **7-round climb**: easy → moderate → hard bands, longer phrases in later tiers (see `lib/progression.ts`). | **Random** difficulty band each round from easy / moderate / hard. |
| **Phrases** | Curated per stage (min/max word counts per round). | **Random** phrases every round, **never shorter than four words**. |
| **Best for** | First-time groups, structured escalation. | Crews who already know the drill and want maximum chaos. |

---

## Solo vs party

- **Solo**: Optimized copy and flow per game (headphones-friendly rehearsal, single-hop Babel, short Reverse rounds).
- **Party**: Configurable **player count** (stepper on create-room), **optional teams**, shared device etiquette called out in **How it works**.

---

## Rounds, scoreboard, and sharing

- **Round intro** explains tier / rules for the current game and round.
- **Scoreboard** summarizes results and drives **reveals** (e.g. English line after the round where the design specifies).
- **Moment share**: retro-styled **poster graphics** can be captured (`react-native-view-shot`) and shared via the system share sheet (`expo-sharing`), with text fallbacks.

---

## Phrase and language content

- Large **phrase catalog** (curated list plus generated mass phrases) so repeats are rarer across sessions.
- Languages are grouped into **difficulty bands** (easy / moderate / hard) for Regular progression and Mayhem sampling.

---

## Backend pipeline (important for production)

The **Expo app** does not embed your Google Cloud key. For **translation, TTS, processing (including reverse / STT)**, you deploy **`babel-party-server`** and point the client at it:

- Set **`EXPO_PUBLIC_PIPELINE_URL`** at build time (or in EAS env vars) to your public API base URL.
- The server holds **`GOOGLE_CLOUD_API_KEY`** and exposes routes such as `/translate`, `/tts`, `/process`, `/health`, `/analytics`.

Without the pipeline URL, some flows fall back or show setup messages; **TestFlight / production builds should always set the URL** to your hosted API.

Optional client flags (see `babel-party/.env.example`):

- **`EXPO_PUBLIC_USE_GOOGLE_TTS`** — prefer server TTS when useful.
- **`EXPO_PUBLIC_FORCE_DEVICE_PHRASE_TTS`** — force on-device phrase TTS.
- **`EXPO_PUBLIC_DISABLE_ANALYTICS`** — disable client analytics posts.

---

## Analytics

When the pipeline URL is set and the server enables logging, the client can **`POST /analytics`** for product events (see server env and `lib/analytics.ts`). Disable on the client with **`EXPO_PUBLIC_DISABLE_ANALYTICS=1`** if needed.

---

## Repository layout

| Path | Role |
|------|------|
| **`babel-party/`** | Expo app (Expo Router, game UI, Zustand store, phrases, pipeline client). |
| **`babel-party-server/`** | Node API, Docker / platform deploy configs. |
| **`DEPLOY.md`** | Hosting, EAS builds (cloud and local), TestFlight / store notes. |
| **`babel_party_master_prd.md`** | Long-form product requirements, vision, and roadmap history. |

---

## Platform notes

- **iOS** bundle id: `party.babelingo.app` (see `babel-party/app.json`).
- **Android** same application id pattern.
- Microphone permission is required for recording turns; copy is declared in the iOS `infoPlist` usage string.

---

## Further reading

- **Deploying the API and mobile builds:** [`DEPLOY.md`](./DEPLOY.md)
- **Product vision, detailed specs, backlog:** [`babel_party_master_prd.md`](./babel_party_master_prd.md)
