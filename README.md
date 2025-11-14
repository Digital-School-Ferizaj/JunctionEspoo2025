# amily
Warm, voice-first companion for older adults. Includes Supabase persistence, ElevenLabs STT/TTS, Featherless.ai + Ollama fallback, and n8n automations.

## Features
- Daily check-ins with audio upload/recording, ElevenLabs transcription, Featherless plan JSON, TTS playback, Utopia Meter, and history management.
- MemoryLane timeline with audio capture, structured summaries, consented snippet sharing (n8n webhook) and RLS-backed snippets.
- Buddy pairing with interest-based opt-in, streak badge, STT + summary for notes, and block/report safeguards.
- Care Circle notifications via n8n, signed Supabase Storage for audio, and short-lived JWT auth.
- Offline demo replay route that replays the last successful flow with no network.

## Stack
- **Backend**: Node 20 + Express + TypeScript + Supabase client. Rate limiting, schema validation (Zod), JWT auth, signed Supabase Storage URLs, ElevenLabs + Featherless + Ollama fallback orchestration.
- **Frontend**: React 18 + Vite + React Query. Accessibility-first screens with warm tone, upload progress, screen reader labels.
- **Infra**: Dockerfile + docker-compose (api + optional Ollama), Supabase SQL + RLS, n8n workflows, OpenAPI spec + Postman collection, Vitest tests.

## Prerequisites
- Node.js 20+
- npm 9+
- Supabase project + service role key and storage bucket `audio`
- ElevenLabs + Featherless.ai credentials (and Ollama if offline fallback desired)
- n8n instance for automations

## Setup
1. **Clone** the repo and copy env template:
   ```bash
   cp .env.example .env
   ```
2. **Fill environment variables** with Supabase keys, API secrets, webhook URLs, JWT secrets, etc.
3. **Install dependencies** (workspace-aware):
   ```bash
   npm install
   ```
4. **Apply Supabase schema**:
   ```bash
   npx supabase login
   npx supabase db push --file supabase/schema.sql
   # or paste supabase/schema.sql in the SQL editor
   ```
   Create the private Storage bucket `audio` as described in `supabase/README.md`.
5. **Seed demo data** (writes one user, two memories, buddy pair, two messages):
   ```bash
   npm run seed --workspace server
   ```
6. **Import n8n workflows** from `n8n/workflows/*.json`, set env vars (`N8N_FROM_EMAIL`, `CARE_*_EMAIL`), copy the resulting webhook URLs into `.env` (`N8N_WEBHOOK_CARECIRCLE_URL`, `N8N_WEBHOOK_SHARE_URL`).

## Running locally
- **API + Web (dev)**: run both with hot reload
  ```bash
  npm run dev
  ```
  - Web: http://localhost:5173 (Today, Memories, Buddy, History, Settings, Demo Replay)
  - API: http://localhost:4000 (see `docs/openapi.yml`)
- **Build**:
  ```bash
  npm run build
  ```
- **Tests** (contracts + e2e + demo data test):
  ```bash
  npm run test
  ```
- **Generate OpenAPI** (already committed, regenerate after route changes):
  ```bash
  npm run openapi:dev --workspace server
  ```

### Switching to Ollama fallback
Set `LLM_PROVIDER=ollama` and `OLLAMA_BASE_URL=http://localhost:11434` (docker-compose already exposes an `ollama` service). Restart the server – AI routes will prefer the local model.

## Docker
Builds both server + React bundle; serves web assets via Express.
```bash
docker compose up --build
```
- API reachable on `http://localhost:4000`
- Ollama service on `http://localhost:11434`

## Supabase + Storage notes
- Schema & RLS in `supabase/schema.sql`. Storage bucket `audio` is private; the server alone uploads and generates signed URLs.
- RLS enforces per-user rows; share snippets grant `to_user_id` read access.

## Integrations
- **ElevenLabs**: `/ai/stt` + `/ai/tts` invoked server-side only with sanitized transcripts.
- **Featherless.ai**: JSON responses enforced by Zod; fallback to Ollama automatically if enabled.
- **n8n**: Workflows for Care Circle notifications and share snippets (see `n8n/README.md`).

## OpenAPI & Postman
- `docs/openapi.yml`
- `docs/amily.postman_collection.json`

## Demo script (˜90 seconds)
1. Sign in as the seeded user (`demo@amily.app` / `1234`).
2. On **Today**, click “Start today’s check-in”, speak for ~20s, wait for transcript, edit a word, hit “Save check-in”. Watch the plan render (Summary • Next small step • Mood) and tap “Play Plan (TTS)”. Note the Utopia Meter bump.
3. Switch to **Memories**, record a short life story, confirm the generated title/era/quote card on the timeline. Choose “Share snippet”, enter the buddy user ID, and mention the n8n email delivery.
4. Visit **Buddy**, note the streak + last summaries, record/send a 20s note, and show the warm summary suggestion.
5. In **Settings**, point out consent toggles, “Pause all sharing”, and export buttons, then mention the privacy + disclaimer text. Wrap with the **Demo Replay** route replaying the last offline flow.

## Acceptance checklist mapping
- Supabase schema, storage notes, and seed script provided.
- Express API exposes all `/api/v1/*` endpoints with auth, RLS checks, and signed URLs; OpenAPI + Postman included.
- AI endpoints call ElevenLabs + Featherless with Ollama fallback; JSON contracts validated.
- React app ships the requested five screens + offline Demo Replay + friendly copy.
- n8n workflows + README documented.
- Docker + compose for one-command boot; `.env.example` lists all secrets.
- Tests: schema contracts + e2e happy path + frontend demo test.
