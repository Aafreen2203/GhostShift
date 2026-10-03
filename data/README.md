# GhostShift synthetic demo dataset

This dataset is **fully fictional**. It contains no real company, employee, or production incident data.

It is deliberately small and shaped for a MongoDB hackathon demo of:

- semantic similarity / Vector Search
- aggregation over troubleshooting outcomes
- “we tried that already”
- knowledge freshness warnings

Embeddings are **not** included here. They should be generated later by the application/seed pipeline.

## Why it was designed this way

### Main demo incident

**`INC-001`** — *Intermittent payment timeouts during peak traffic*

This is the primary historical match for the live Payment API demo:

- DB connections climbing toward capacity
- elevated payment latency
- intermittent payment timeouts

Stored memory for `INC-001`:

1. Restart Payment API Kubernetes deployment → **temporary**
2. Increase API timeout → **failed**
3. Increase database connection pool → **resolved**

Its `historicalConfig` uses `payments-primary` with `connectionPoolMax: 20`, while the live Payment API service uses `payments-prod-v2` with `connectionPoolMax: 100`. That difference supports:

> Historical infrastructure differs from the current environment.

### Difficult Vector Search cases

These Payment API incidents share latency / timeout / failure language but have **different root causes**:

| Incident | Looks like | Actual root cause |
| --- | --- | --- |
| `INC-001` | timeouts + latency + DB pressure | connection pool exhaustion |
| `INC-002` | slow payments + intermittent failures + timeouts | third-party provider degradation |
| `INC-003` | immediate payment failures | expired provider credential |
| `INC-004` | delayed payments / backlog | queue / worker saturation |

`INC-001` and `INC-002` are the strongest similarity pair: similar customer-facing symptoms, different causes. GhostShift should retrieve evidence, not assume “timeout = pool problem.”

Wording is intentionally varied across incidents so later Vector Search is not reduced to exact string matching.

### “We've tried that already”

Restart-style Payment API actions appear in multiple incidents and never permanently resolve the issue:

| Action | Incident | Outcome |
| --- | --- | --- |
| Restart Payment API Kubernetes deployment | `INC-001` | temporary |
| Restart Payment API container | `INC-002` | failed |
| Restart Payment API pods | `INC-003` | failed |
| Restart Payment API Kubernetes deployment | `INC-004` | temporary |

That supports aggregation stories such as:

> Container/deployment restart was attempted multiple times. It provided temporary recovery in some cases and permanently resolved 0.

`successful` is `true` only when `outcome` is `resolved`. Temporary mitigations are explicitly `successful: false`.

### Knowledge freshness

Historical configs intentionally differ from current service configs, especially:

- `INC-001` vs Payment API current config (`database`, `connectionPoolMax`)
- `INC-005` vs Authentication Service current Redis pool settings
- `INC-008` / `INC-009` vs Notification Service worker / rate settings

## Demo events

`demo-events.json` is **not** historical incident memory. It is a controlled live sequence for the simulator:

1. DB connections 75%
2. DB connections 87%
3. DB connections 96%
4. Payment latency increasing
5. Payment timeout rate increasing

Later, Vector Search should reasonably surface `INC-001` for that story.

## Counts

- Services: 3
- Incidents: 9
- Actions: 30
- Demo events: 5
