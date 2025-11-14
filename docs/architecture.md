# amily Architecture

## Overview
- **Client**: Vite + React + TypeScript single-page app with React Router and React Query. Provides Today, Memories, Buddy, History, Settings, and Demo Replay screens with accessible components.
- **Server**: Node.js (Express + TypeScript). Handles authentication, Supabase persistence, AI/STT/TTS orchestration, signed URL wrapping, rate limiting, consent enforcement, and integrations.
- **Supabase**: Postgres schema (DDL + RLS) plus Storage bucket udio used for entries/memories/messages with signed URLs. Service-role key is used only inside the server; the client relies on server-issued JWTs.
- **AI Providers**:
  - Primary: Featherless.ai (default model llama-3.1-8b-instruct).
  - Fallback: Ollama via OLLAMA_BASE_URL for offline demos. Switch through LLM_PROVIDER env (eatherless | ollama).
  - ElevenLabs handles STT/TTS on the server.
- **Automation**: n8n workflows triggered via signed webhooks for Care Circle status notifications and share snippet emails/SMS.
- **Testing**: Vitest for schema contracts, Supertest-driven e2e “happy path”.
- **Containerization**: Dockerfile builds server + client. docker-compose provides one command boot (server + client + optional ollama stub).

## API Summary
- Base URL /api/v1 with Express router modules per domain (auth, media, ai, entries, memories, buddy, exports, shares).
- Middlewares: JWT auth, Supabase row ownership guards, request logging, rate limiting on /ai/* and /media/*, schema validation via Zod.
- JSON schemas enforced server-side; transcripts sanitized before AI calls, and minor schema drift auto-repaired using validator hints.

## Client Flows
1. **Today**: Show CTA “Start today’s check-in”, upload audio (progress), poll STT + Plan JSON, allow transcript edits, render plan card with labels “Summary • Next small step • Mood”, TTS playback, Utopia Meter widget.
2. **Memories**: Timeline cards with era + quote, record story, auto-summarize, share snippet (consent-first) with n8n webhook call.
3. **Buddy**: Opt-in toggle, pairing card, dual-note view with streak, 20–30s recording UI, ability to block/report (report triggers moderation message).
4. **History**: List past check-ins with delete.
5. **Settings**: Manage interests, consents, “Pause all sharing”, exports, privacy disclaimer text.
6. **Demo Replay**: Offline safe script that replays last cached successful flow for demos.

## Security/Privacy
- Short-lived JWT access tokens (15m) + refresh tokens (12h) stored httpOnly; Supabase RLS ensures users touch only their rows.
- Signed URLs (10 min) generated on demand; share revocation triggers Supabase signed URL revocation + n8n call.
- Basic transcript moderation, PII scrubbing, buddy block/report flows, audit logging of share events via shares table + server log.

## Integrations
- **Supabase**: SQL migrations + supabase/setup.md instructions. scripts/seed.ts seeds demo data.
- **n8n**: JSON workflows under 
8n/workflows, README describes env vars and nodes.
- **OpenAPI + Postman**: docs/openapi.yml and docs/amily.postman_collection.json stay in sync with server routes (generated via 
pm run openapi script from server).

## Performance Targets
- Static asset prefetch for UI; upload progress uses chunked fetch to show completion quickly.
- API response caching for GET endpoints via in-memory cache (per-process) excluding AI routes.
- Rate limiting for /media/* (20/min) and /ai/* (10/min) per user.

