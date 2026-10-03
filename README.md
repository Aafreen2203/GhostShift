# GhostShift

Institutional memory for engineering teams.

**When people leave, their technical knowledge shouldn’t leave with them.**

GhostShift stores historical incident knowledge in MongoDB. When a new failure appears, it retrieves similar incidents with Vector Search, shows what engineers tried before, warns when infrastructure changed, and produces an evidence-grounded brief for a human decision.

## Architecture

```text
Next.js UI
  ↓
Next.js Route Handlers
  ↓
MongoDB Atlas (ghostshift)
  ├── documents: services / incidents / actions / events
  ├── Vector Search (+ cosine fallback)
  ├── aggregation (“we tried that already”, freshness)
  └── Change Streams → SSE (/api/stream)

Optional: OpenAI enrichment (evidence-only prompts)
```

## Demo flow

1. Open `/dashboard`
2. Open `/simulator` and fire:
   - DB connections 87%
   - DB connections 96% *(opens active incident)*
   - or timeout after pressure
3. Open the active incident → **Investigate with GhostShift**
4. Review similar historical memory (`INC-001` should rank strongly)
5. Review failed / temporary / resolved actions
6. Review “We’ve tried that already” counts from MongoDB
7. Review knowledge freshness warning
8. Optionally set `OPENAI_API_KEY` for grounded AI wording

## Running locally

```bash
npm install
copy .env.example .env.local
```

Set `MONGODB_URI`. Allow your IP in Atlas Network Access.

```bash
npm run seed
npm run dev
```

Open http://localhost:3000

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Atlas connection string |
| `OPENAI_API_KEY` | No | Optional grounded AI brief |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |

Database name is always `ghostshift`.

Atlas Vector Search index expected by code:

- name: `incident_embedding_index`
- path: `embedding`
- dimensions: `384`
- similarity: `cosine`

`npm run seed` generates embeddings and attempts to create this index. If index creation fails, cosine fallback still ranks stored vectors.

## Seed data

Synthetic only:

- 3 services
- 9 incidents (`INC-001`…`INC-009`)
- 30 actions
- 5 demo events in `data/demo-events.json` (used by simulator presets; not auto-inserted by seed)

Main demo incident: **`INC-001`** (connection pool exhaustion).  
Hard case: **`INC-002`** (provider degradation) with similar symptoms.

## Important product rules

- Historical root causes are evidence, not confirmed current causes
- Action statistics come from MongoDB, never invented by the LLM
- No autonomous remediation
- Temporary actions use `successful: false`; only `resolved` uses `successful: true`

## Team boundaries

- MongoDB/backend: `lib/mongodb.ts`, aggregation, incident-engine, change-stream, seed/data, APIs
- AI/retrieval: embeddings, vector-search, agent, optional `src/ai`
- Frontend/demo: `app/*`, `components/*`
