# GhostShift

GhostShift is an AI-powered institutional memory system for engineering teams.

When a developer, DevOps engineer, or system owner leaves, practical knowledge about failures, failed fixes, temporary recoveries, and successful resolutions can leave with them. GhostShift stores that technical incident knowledge in MongoDB so the next person on call can look it up.

GhostShift preserves technical incident knowledge so future engineers can retrieve:

- similar failures
- previous troubleshooting attempts
- failed fixes
- temporary fixes
- successful resolutions

This repository is the shared foundation. Vector Search, incident analysis, aggregation, and Change Streams are stubbed on purpose so three teammates can build them in parallel.

## Architecture

```text
Next.js
  ↓
Next.js Route Handlers
  ↓
MongoDB Atlas  (database: ghostshift)
```

Future integrations, not implemented in this pass:

- MongoDB Vector Search
- AI incident analysis
- Aggregation
- Change Streams
- knowledge freshness comparison

## Collections

Database name: `ghostshift`

| Collection | What it stores |
| --- | --- |
| `services` | Systems the team owns, including current status and `currentConfig`. |
| `incidents` | Failures, symptoms, root cause, resolution, and the config at the time (`historicalConfig`). |
| `events` | Incoming monitoring signals. The simulator writes these. Detection is not built yet. |
| `actions` | What engineers tried, and whether the outcome was `failed`, `temporary`, or `resolved`. |

Shared TypeScript interfaces live in `types/`. Those field names are the team contract.

**Shared TypeScript interfaces and database field names are part of the team contract. Coordinate before changing them.**

## Running locally

```bash
npm install
copy .env.example .env.local
```

Set `MONGODB_URI` in `.env.local` to your MongoDB Atlas connection string. Do not commit that file.

```bash
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run seed` connects to MongoDB, clears only the four GhostShift collections, and inserts the synthetic demo data:

- 3 services (Payment API, Authentication Service, Notification Service)
- 6 resolved historical incidents
- 15 actions

The events collection is cleared and left empty.

## What works now

- `GET /api/health` checks MongoDB
- `GET /api/services`
- `GET /api/incidents` with optional `status` and `serviceId`
- `GET /api/incidents/:id`
- `GET /api/incidents/:id/actions`
- `POST /api/events` stores a system event
- `POST /api/incidents/:id/resolve` with `{ "resolution": "...", "rootCause": "..." }`
- Dashboard, incident list, and incident detail read that data
- The simulator can insert synthetic events
- Search shows a placeholder and does not fake similarity

Placeholders:

- `POST /api/incidents/search`
- `POST /api/agent/analyse`
- `GET /api/stream`

## Team workstreams

### Workstream 1 — MongoDB / Backend

- aggregation
- event processing
- Change Streams
- knowledge freshness

Start here:

- `lib/aggregation.ts`
- `lib/incident-engine.ts`
- `lib/change-stream.ts`
- `app/api/events/route.ts`
- `app/api/stream/route.ts`

`historicalConfig` on each incident and `currentConfig` on each service are already different, so freshness checks have something to compare.

### Workstream 2 — AI / Retrieval

- embeddings
- MongoDB Vector Search
- incident similarity
- evidence-grounded incident brief
- "We tried that already"

Start here:

- `lib/embeddings.ts`
- `lib/vector-search.ts`
- `lib/agent.ts`
- `app/api/incidents/search/route.ts`
- `app/api/agent/analyse/route.ts`
- `components/SimilarIncidentCard.tsx`
- `components/AgentBrief.tsx`

Payment API has three different historical incidents so search has more than one case to rank. Do not return fake vectors or fake scores.

### Workstream 3 — Frontend / Demo

- dashboard polish
- incident intelligence view
- simulator
- live updates
- responsive design

Start here:

- `app/dashboard/page.tsx`
- `app/incidents/page.tsx`
- `app/incidents/[id]/page.tsx`
- `app/search/page.tsx`
- `app/simulator/page.tsx`
- `components/`

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string. Placeholder only in `.env.example`. |

The application uses the database name `ghostshift`. Credentials are never hardcoded.

## Demo data

All seed records are fictional. Do not replace them with real employee or company incidents.

Stable ids for local demos:

- Services: `payment-api`, `auth-service`, `notification-service`
- Payment incidents: `inc-pay-timeouts`, `inc-pay-expired-credentials`, `inc-pay-provider-latency`
