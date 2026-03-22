# Sessions & MCP Simulation — Product Requirements

## Overview

Sessions group related runs into logical tasks. A session represents a complete agent interaction (e.g., "code review", "bug fix", "research task") that may consist of multiple runs. The MCP simulation component demonstrates the full agent integration lifecycle in the browser, proving the MCP server works end-to-end.

## Goals

- Group runs into sessions for meaningful analytics (duration, cost, success per task)
- Show session-level metrics alongside run-level data
- Provide a live MCP demo component that evaluators can trigger from the dashboard
- Prove the MCP server works end-to-end with real data

## Data Model

### Session (monitoring context)

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique identifier |
| agentId | UUID | Agent that owns this session |
| name | string? | Optional session name (e.g., "Code review PR #42") |
| status | enum | `active`, `completed`, `failed` |
| startedAt | timestamp | When the first run started |
| completedAt | timestamp? | When the last run finished |
| totalDurationMs | integer? | Sum of all run durations |
| totalTokensUsed | integer? | Sum of all run tokens |
| totalCost | decimal? | Sum of all run costs |
| runCount | integer | Number of runs in this session |
| metadata | jsonb? | Arbitrary session-level data |
| createdAt | timestamp | Creation time |

### Run Updates

Add `sessionId` (optional UUID) to the existing `runs` table. Runs can exist without a session (backward compatible).

## Integration

### Session Lifecycle via MCP/HTTP

Sessions are created and managed through the ingest API:

| Event | Description |
|---|---|
| `session.started` | Create a new session, returns sessionId |
| `run.started` | Accepts optional `sessionId` to link run to session |
| `session.completed` | Mark session as completed, aggregate metrics |
| `session.failed` | Mark session as failed |

### MCP Tools Updates

| Tool | Description |
|---|---|
| `start_session` | Create a new session, returns sessionId |
| `report_run_started` | Add `sessionId` param (optional) |
| `end_session` | Complete or fail the session |
| `get_my_sessions` | List recent sessions with stats |

## User Stories

### US-1: View sessions list

**As** an org member viewing an agent's detail page
**I want to** see a list of sessions instead of (or alongside) individual runs
**So that** I can understand agent activity at the task level

**Acceptance criteria:**
- Agent detail page shows a "Sessions" tab alongside "Runs"
- Each session shows: name, status, run count, total duration, total cost, started time
- Clicking a session expands to show its runs
- Sessions sorted by most recent

### US-2: Session metrics

**As** an org member
**I want to** see session-level metrics on the agent detail page
**So that** I get a higher-level view of agent performance

**Acceptance criteria:**
- Stats cards include: Total Sessions, Avg Session Duration, Session Success Rate
- These complement the existing run-level metrics

### US-3: MCP Simulation

**As** an evaluator or user
**I want to** trigger a live MCP simulation from the agents list page
**So that** I can see the full agent integration lifecycle working end-to-end

**Flow:**
The simulation creates a fresh agent, runs a full session with multiple runs, and shows the terminal log — all from a single "Simulate" button.

**Acceptance criteria:**
- Simulation intro card shown on the agents list page (above the agents list) explaining what will happen
- "Start Simulation" button inside the card
- Clicking it opens a terminal-style log panel
- Simulation steps (with delays between each):
  1. Create a new agent ("Simulation Agent — {timestamp}") via API → gets connection token
  2. `start_session("Demo: Code Review")`
  3. `report_run_started(run_001, sessionId)` — "Analyzing files"
  4. Wait 1-2s (simulating work)
  5. `report_run_completed(run_001, {durationMs: 2300, tokensUsed: 450, cost: 0.12})`
  6. `report_run_started(run_002, sessionId)` — "Generating review"
  7. Wait 1s
  8. `report_run_failed(run_002, "Rate limit exceeded")` — intentional failure
  9. `report_run_started(run_003, sessionId)` — "Retry: Generating review"
  10. Wait 1-2s
  11. `report_run_completed(run_003, {durationMs: 1800, tokensUsed: 380, cost: 0.09})`
  12. `end_session(sessionId)` — completes the session
  13. `get_my_sessions()` — show the completed session with aggregated stats
- Each step shows: step number, tool name, params, response, timing, status icon (✓/✗)
- Green checkmarks for success, red X for intentional failure
- After simulation completes:
  - The new agent appears in the agents list
  - Clicking it shows the session with 3 runs
  - Dashboard metrics update
- Uses the real HTTP ingest API with the connection token (demonstrates the same flow as MCP)
- "Run Again" button to repeat with a new agent

### US-4: Create/manage sessions via ingest

**As** an agent (via MCP/HTTP)
**I want to** create sessions and link runs to them
**So that** related runs are grouped for analytics

**Acceptance criteria:**
- `session.started` creates a new session, returns sessionId
- `run.started` with sessionId links the run
- `session.completed` aggregates run metrics into session totals
- Sessions without explicit completion auto-complete when all runs finish

## Pages

| Page/Component | Location | Description |
|---|---|---|
| Sessions tab | Agent detail page | Tab showing sessions list |
| Session detail | Expandable row | Shows runs within a session |
| MCP Simulation | Agents list page | Intro card with "Start Simulation" + terminal panel |

## API Endpoints

### Monitoring context (connection token auth)

| Event | Description |
|---|---|
| `session.started` | via POST /ingest or MCP `start_session` |
| `session.completed` | via POST /ingest or MCP `end_session` |
| `session.failed` | via POST /ingest or MCP `end_session` |

### Monitoring context (JWT auth)

| Method | Endpoint | Description |
|---|---|---|
| GET | /agents/:id/sessions | List sessions for agent (paginated) |
| GET | /agents/:id/sessions/:sessionId | Session detail with runs |

## Bounded Context

Sessions belong to the **monitoring** context (same as runs):

```
monitoring/
  domain/
    entities/        session.ts (new), run.ts (add sessionId)
    value-objects/   session-status.ts (new)
    events/          session-completed.event.ts (new)
  application/
    use-cases/       ingest-session-event.ts (new)
                     list-sessions.ts (new)
                     get-session.ts (new)
  ports/
    repositories/    session-repository.ts (new)
```

## MCP Simulation Component

```
apps/web/
  components/features/
    mcp-simulation/
      mcp-simulation-panel.tsx    # Terminal-style log panel with steps
  hooks/
    use-mcp-simulation.ts         # State: steps, logs, running status
                                  # Logic: create agent → run session → show results
```

The simulation uses the HTTP ingest API with the real connection token (not the MCP protocol in the browser). The log presents each step as the equivalent MCP tool call for demonstration purposes. This avoids needing the MCP client SDK in the browser bundle while producing identical server-side results.

### Simulation Flow (Technical)

1. `POST /agents` (JWT auth) → creates agent, gets `connectionToken`
2. `POST /ingest` (token auth) → `session.started`
3. `POST /ingest` (token auth) → `run.started` with sessionId
4. `POST /ingest` (token auth) → `run.completed`
5. ... more runs ...
6. `POST /ingest` (token auth) → `session.completed`
7. `GET /agents/:id/sessions` (JWT auth) → show final result
8. Invalidate React Query caches → agents list + dashboard update
