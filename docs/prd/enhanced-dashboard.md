# Enhanced Analytics Dashboard PRD

## Problem

The current dashboard shows 4 high-level metric cards (total agents, active runs, avg response time, active alarms). Engineers need deeper visibility into agent performance trends, cost distribution, error patterns, and comparative analysis across agents to make informed decisions.

## Goal

Add distribution charts, comparative tables, and real-time activity feeds to transform the dashboard from a status overview into an actionable analytics tool.

---

## Features

### 1. Distribution Charts

**User stories:**

- As an engineer, I want to see a histogram of run durations so I can identify performance bottlenecks.
- As an engineer, I want to see token usage per agent so I can understand cost drivers.
- As an engineer, I want to see error breakdowns so I can prioritize which failures to fix first.

**Charts:**


| Chart                     | Type                   | Data Source                                                               |
| ------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| Run Duration Distribution | Bar chart (vertical)   | Completed runs grouped by duration buckets (<1s, 1-3s, 3-5s, 5-10s, >10s) |
| Token Usage by Agent      | Bar chart (horizontal) | Total tokens per agent, sorted highest first                              |
| Error Breakdown           | Pie/donut chart        | Failed runs grouped by error message                                      |


**Behavior:**

- Charts update when the user switches organization
- Empty state when no runs exist: "No data yet — connect agents to start monitoring"
- Charts load independently (each has its own loading spinner)

### 2. Agent Comparison Table

**User stories:**

- As a team lead, I want to compare all agents side by side so I can identify underperformers.
- As an engineer, I want to sort agents by different metrics so I can focus on what matters.

**Columns:**


| Column       | Description                     | Sortable           |
| ------------ | ------------------------------- | ------------------ |
| Agent        | Name + type badge               | Yes (alphabetical) |
| Total Runs   | Count of all runs               | Yes                |
| Success Rate | Completed / total (percentage)  | Yes                |
| Avg Duration | Mean duration of completed runs | Yes                |
| Tokens Used  | Total tokens consumed           | Yes                |
| Total Cost   | Sum of run costs                | Yes                |


**Behavior:**

- Click column header to sort (toggle asc/desc)
- Success rate color: green (>80%), yellow (50-80%), red (<50%)
- Links to agent detail page on row click
- Empty state when no agents exist

### 3. Real-Time Activity Feed (SSE)

**User stories:**

- As an engineer, I want to see live events as agents report so I know what's happening right now.
- As a team lead, I want a scrollable log of recent activity without refreshing the page.

**Events displayed:**

- Run started (blue dot)
- Run completed (green dot + duration)
- Run failed (red dot + error message)
- Session started/completed
- Agent connected (first heartbeat)

**Behavior:**

- Server-Sent Events (SSE) connection to `GET /dashboard/events`
- Max 50 items in the feed, oldest removed as new arrive
- Each event shows: timestamp, agent name, event type, details
- Reconnects automatically on disconnect
- Can be collapsed/expanded

### 4. Tool Call Tracking

**User stories:**

- As an engineer, I want to see which tools my agents call most frequently so I can optimize integrations.
- As a team lead, I want to track tool usage patterns across the organization.

**Data model:**

- New entity: ToolCall (runId, toolName, durationMs, success, timestamp)
- Ingested via `POST /ingest` with event `tool.called`
- New MCP tool: `report_tool_call`

**Dashboard integration:**

- "Top Tools" card showing most-called tools with call counts
- Tool call timeline within run detail (future)

### 5. Agent Usage Stats (on Agent Detail)

**User stories:**

- As an engineer, I want to see my agent's usage stats (tokens, cost, runs) for the current month and past months.

**Display (read-only, no configuration):**
- Current period summary: tokens, cost, runs for this month
- Usage history table: period, runs, tokens, cost, success rate

**Location:** Below the tabs on the agent detail page.

---

## Priority Order

1. **Distribution Charts** — highest demo impact, works with existing data
2. **Agent Comparison Table** — complements charts, uses same data
3. **Real-Time Activity Feed** — shows technical depth (SSE)
4. **Tool Call Tracking** — new data pipeline
5. **Agent Usage Stats** — read-only display on agent detail

---

## Out of Scope (for this iteration)

- Usage quotas / limits / alerts (separate PRD)
- Historical time-series charts (runs over time, cost trends)
- Export/download reports
- Custom date range filters

---

## Technical Notes

- Charts library: Recharts (lightweight, React-native)
- SSE transport: NestJS `@Sse()` decorator with EventEmitter2
- All new data flows through existing ingest endpoint
- New contracts validate all API responses
- Dashboard page uses `useOrgSwitcher()` for org context

