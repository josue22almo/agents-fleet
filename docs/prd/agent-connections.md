# Agent Connections — Product Requirements

## Overview

Users connect AI agents to their organization to monitor performance and track runs. Each agent gets a unique API key that it uses to send events to the platform. The system starts with basic run tracking and is designed to extend to logs and traces.

## Goals

- Allow users to connect any AI agent (Claude, Manus, custom) to an organization
- Provide a simple ingest API for agents to report run events
- Display agent status, run history, and basic metrics on the dashboard
- Extensible data model that supports adding logs and traces later

## Bounded Contexts

This feature spans two bounded contexts:

### Agents context

Owns the agent entity, API key lifecycle, and CRUD operations. This is a core context that future features (monitoring, workflows) reference by agent ID.

```
packages/contexts/src/
  agents/
    domain/
      entities/        agent.ts
      value-objects/    agent-type.ts, agent-status.ts, api-key.ts
      errors/          agent-not-found.error.ts, invalid-api-key.error.ts, ...
      events/          agent-created.event.ts
    application/
      use-cases/       create-agent.ts, list-agents.ts, get-agent.ts,
                       update-agent.ts, delete-agent.ts, regenerate-api-key.ts,
                       validate-api-key.ts
    ports/
      repositories/    agent-repository.ts
    infrastructure/
      persistence/     supabase-agent.repository.ts
```

### Monitoring context

Owns runs, event ingestion, and metrics aggregation. References agents by ID only — no import from the agents context.

```
packages/contexts/src/
  monitoring/
    domain/
      entities/        run.ts
      value-objects/    run-status.ts
      errors/          run-not-found.error.ts
      events/          run-completed.event.ts, run-failed.event.ts
    application/
      use-cases/       ingest-event.ts, list-runs.ts, get-run.ts,
                       get-agent-metrics.ts
    ports/
      repositories/    run-repository.ts
    infrastructure/
      persistence/     supabase-run.repository.ts
```

### Context boundaries

- `monitoring` receives an `agentId` (plain string) — it never imports from `agents`
- The API layer (NestJS) coordinates: validates the API key via the agents context, then passes the `agentId` to the monitoring context for ingestion
- Future `workflows` context follows the same pattern — references agents by ID

## Data Model

### Agent (agents context)

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique identifier |
| organizationId | UUID | Owning organization |
| name | string | Display name (e.g., "Claude Code — Production") |
| type | enum | Agent provider: `claude`, `manus`, `custom` |
| apiKeyHash | string | SHA-256 hash of the API key |
| apiKeyPrefix | string | First 8 chars of the key (for display: `af_sk_ab...`) |
| status | enum | `active`, `inactive`, `error` |
| lastSeenAt | timestamp? | Last time the agent sent data |
| createdBy | UUID | User who created the agent |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update time |

### Run (monitoring context)

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique identifier |
| agentId | UUID | Agent that performed the run (plain ID, no FK to agents context) |
| externalRunId | string? | Optional ID from the agent's own system |
| status | enum | `running`, `completed`, `failed` |
| startedAt | timestamp | When the run started |
| completedAt | timestamp? | When the run finished |
| durationMs | integer? | Total duration in milliseconds |
| tokensUsed | integer? | Total tokens consumed |
| cost | decimal? | Estimated cost in USD |
| metadata | jsonb? | Arbitrary key-value data from the agent |
| error | text? | Error message if status is `failed` |

### Future: Log Entry (not in v1)

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique identifier |
| runId | UUID | Parent run |
| level | enum | `info`, `warn`, `error`, `debug` |
| message | text | Log message |
| timestamp | timestamp | When the log was emitted |
| metadata | jsonb? | Additional context |

### Future: Trace Span (not in v1)

| Field | Type | Description |
|---|---|---|
| id | UUID | Span identifier |
| runId | UUID | Parent run |
| parentSpanId | UUID? | Parent span (for nested traces) |
| name | string | Operation name |
| startedAt | timestamp | Span start |
| durationMs | integer | Span duration |
| metadata | jsonb? | Span attributes |

## Integration Model

### API Key Authentication

- Users create an agent in the dashboard and receive a one-time visible API key
- The API key is prefixed with `af_` for easy identification
- The key is hashed (SHA-256) before storage — only the prefix is stored in plaintext for lookup
- Agents authenticate via `Authorization: Bearer af_sk_...` header

### Ingest API

All events are sent to `POST /ingest` with the agent's API key.

```
POST /ingest
Authorization: Bearer af_sk_abc123...
Content-Type: application/json

{
  "event": "run.started",
  "runId": "ext-123",
  "timestamp": "2026-03-22T10:00:00Z",
  "data": {
    "metadata": { "task": "code-review", "repo": "my-app" }
  }
}
```

#### Events

| Event | Required Fields | Optional Fields |
|---|---|---|
| `run.started` | runId | metadata |
| `run.completed` | runId | durationMs, tokensUsed, cost, metadata |
| `run.failed` | runId, error | durationMs, tokensUsed, metadata |

- `runId` is the agent's own run identifier — the platform maps it to an internal run
- If `run.started` is not sent, `run.completed`/`run.failed` creates the run implicitly
- Duplicate events (same runId + event type) are idempotent

## User Stories

### US-1: Create an agent

**As** an org owner or admin
**I want to** create a new agent connection
**So that** I can start receiving metrics from that agent

**Acceptance criteria:**
- Can set agent name and type (claude, manus, custom)
- API key is generated and shown once (copyable)
- After dismissing, the key cannot be retrieved again
- Agent appears in the agents list with "inactive" status

### US-2: View agents list

**As** an org member
**I want to** see all connected agents
**So that** I can monitor their status

**Acceptance criteria:**
- Shows agent name, type, status, and last seen time
- Status updates to "active" when data is received, "inactive" after 24h of no data
- Owners/admins see a "Settings" button per agent

### US-3: Send run events

**As** an agent (via API)
**I want to** report run events
**So that** the dashboard shows my activity

**Acceptance criteria:**
- `run.started` creates a new run in "running" status
- `run.completed` marks the run as completed with metrics
- `run.failed` marks the run as failed with error info
- Invalid API key returns 401
- Invalid event format returns 400

### US-4: View agent runs

**As** an org member
**I want to** see the run history for an agent
**So that** I can understand its activity and performance

**Acceptance criteria:**
- Lists runs sorted by most recent
- Shows status (running/completed/failed), duration, tokens, cost
- Failed runs show error message
- Paginated (20 per page)

### US-5: Agent settings

**As** an org owner or admin
**I want to** manage agent settings
**So that** I can rename, regenerate keys, or delete agents

**Acceptance criteria:**
- Can rename the agent
- Can regenerate the API key (invalidates the old one)
- Can delete the agent (soft delete — keeps run history)
- Confirmation required for key regeneration and deletion

### US-6: Dashboard metrics from agents

**As** an org member
**I want to** see aggregated metrics on the dashboard
**So that** I get an overview of all agent activity

**Acceptance criteria:**
- "Total Agents" card shows count of active agents
- "Active Runs" card shows currently running runs
- "Avg Response Time" shows average run duration (last 24h)
- Empty state replaced with real data once agents report runs

## Pages

| Page | Route | Description |
|---|---|---|
| Agents list | `/agents` | All agents in the current org |
| Connect agent | `/agents/new` | Form to create a new agent |
| Agent detail | `/agents/:id` | Run history and stats for one agent |
| Agent settings | `/agents/:id/settings` | Rename, regenerate key, delete |

## Permissions

| Action | Owner | Admin | Member |
|---|---|---|---|
| View agents list | Yes | Yes | Yes |
| View agent runs | Yes | Yes | Yes |
| Create agent | Yes | Yes | No |
| Edit agent settings | Yes | Yes | No |
| Regenerate API key | Yes | Yes | No |
| Delete agent | Yes | No | No |

## API Endpoints

### Agents context (JWT auth)

| Method | Endpoint | Description |
|---|---|---|
| GET | /agents | List agents in current org |
| POST | /agents | Create new agent |
| GET | /agents/:id | Agent detail |
| PATCH | /agents/:id | Update agent (rename) |
| DELETE | /agents/:id | Delete agent |
| POST | /agents/:id/regenerate-key | Regenerate API key |

### Monitoring context (API key auth)

| Method | Endpoint | Description |
|---|---|---|
| POST | /ingest | Ingest run events from agents |

### Monitoring context (JWT auth)

| Method | Endpoint | Description |
|---|---|---|
| GET | /agents/:id/runs | List runs for agent (paginated) |
| GET | /agents/:id/metrics | Aggregated metrics for agent |
