# Agent Connections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to connect AI agents to their organizations, receive run events via HTTP ingest and MCP server, and view agent metrics on the dashboard.

**Architecture:** Two new bounded contexts (`agents` and `monitoring`) in `packages/contexts/`, following the same DDD/hexagonal patterns as the existing `iam` context. The API layer wires both contexts with NestJS modules. The web app adds 4 new pages with React Query hooks. An MCP server endpoint exposes tools for agent self-reporting. Profile gets change-password and avatar upload via Supabase Storage.

**Tech Stack:** TypeScript, NestJS, Supabase (Postgres + Storage), Next.js, React Query, Zod, Vitest, Playwright, MCP SDK

**PRD:** `docs/prd/agent-connections.md`
**Architecture:** `docs/backend-architecture.md`, `docs/frontend-architecture.md`
**Mockups:** `docs/mockups/agents/`

---

## File Structure

### Agents Context (`packages/contexts/src/agents/`)

```
agents/
  domain/
    entities/           agent.ts, agent.test.ts
    value-objects/       agent-type.ts, agent-status.ts, connection-token.ts, connection-token.test.ts
    errors/             agent-not-found.error.ts, invalid-connection-token.error.ts
    events/             agent-created.event.ts
  application/
    use-cases/          create-agent.ts, create-agent.test.ts
                        list-agents.ts, list-agents.test.ts
                        get-agent.ts, get-agent.test.ts
                        update-agent.ts, update-agent.test.ts
                        delete-agent.ts, delete-agent.test.ts
                        regenerate-token.ts, regenerate-token.test.ts
                        validate-connection-token.ts, validate-connection-token.test.ts
  ports/
    repositories/       agent-repository.ts
  infrastructure/
    persistence/        supabase-agent.repository.ts
                        in-memory-agent-repository.ts
  index.ts
```

### Monitoring Context (`packages/contexts/src/monitoring/`)

```
monitoring/
  domain/
    entities/           run.ts, run.test.ts
    value-objects/       run-status.ts
    errors/             run-not-found.error.ts
    events/             run-completed.event.ts, run-failed.event.ts
    read-models/        agent-metrics.ts
  application/
    use-cases/          ingest-event.ts, ingest-event.test.ts
                        list-runs.ts, list-runs.test.ts
                        get-agent-metrics.ts, get-agent-metrics.test.ts
  ports/
    repositories/       run-repository.ts
  infrastructure/
    persistence/        supabase-run.repository.ts
                        in-memory-run-repository.ts
  index.ts
```

### Contracts (`packages/contracts/src/`)

```
agents/
  agents.ts             # CreateAgentRequest, AgentResponse, AgentListItem schemas
  runs.ts               # RunResponse, IngestEventRequest schemas
  index.ts
```

### API (`apps/api/src/`)

```
agents/
  controllers/          agents.controller.ts, agents.controller.test.ts
                        ingest.controller.ts, ingest.controller.test.ts
                        runs.controller.ts
  guards/               connection-token.guard.ts
  agents.module.ts
  test-agents.module.ts
mcp/
  mcp.controller.ts     # MCP server endpoint
  mcp.module.ts
```

### Web (`apps/web/`)

```
hooks/
  use-agents.ts
  use-agent-detail.ts
  use-agent-runs.ts
  use-create-agent-form.ts
  use-agent-settings.ts
  use-change-password-form.ts
components/features/
  agents-list/          agents-list-page.tsx
  connect-agent/        connect-agent-form.tsx, token-display.tsx
  agent-detail/         agent-detail-page.tsx, runs-table.tsx
  agent-settings/       agent-settings-page.tsx
  edit-profile/         change-password-form.tsx (add to existing folder)
  avatar-upload/        avatar-upload.tsx
app/(dashboard)/
  agents/               page.tsx
  agents/new/           page.tsx
  agents/[id]/          page.tsx
  agents/[id]/settings/ page.tsx
e2e/
  agents.test.ts
  agent-detail.test.ts
```

### Database

```
supabase/migrations/
  006_agents_schema.sql
  007_runs_schema.sql
  008_storage_avatars.sql
```

---

## Workstream A: Agents Context (Domain + Application + Infrastructure)

### Task 1: Agent Value Objects

**Files:**
- Create: `packages/contexts/src/agents/domain/value-objects/agent-type.ts`
- Create: `packages/contexts/src/agents/domain/value-objects/agent-status.ts`
- Create: `packages/contexts/src/agents/domain/value-objects/connection-token.ts`
- Create: `packages/contexts/src/agents/domain/value-objects/connection-token.test.ts`

- [ ] **Step 1: Create AgentType enum**

```typescript
// agent-type.ts
export enum AgentType {
  CLAUDE = "claude",
  MANUS = "manus",
  CUSTOM = "custom",
}
```

- [ ] **Step 2: Create AgentStatus enum**

```typescript
// agent-status.ts
export enum AgentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ERROR = "error",
}
```

- [ ] **Step 3: Write failing test for ConnectionToken**

```typescript
// connection-token.test.ts
describe("ConnectionToken", () => {
  it("generates a token with af_ prefix", () => {
    const token = ConnectionToken.generate();
    expect(token.value).toMatch(/^af_/);
  });

  it("hashes the token with SHA-256", () => {
    const token = ConnectionToken.generate();
    expect(token.hash).not.toBe(token.value);
    expect(token.hash.length).toBe(64); // SHA-256 hex
  });

  it("extracts prefix for display", () => {
    const token = ConnectionToken.generate();
    expect(token.prefix.length).toBe(11); // "af_" + 8 chars
  });

  it("verifies a token against its hash", () => {
    const token = ConnectionToken.generate();
    expect(ConnectionToken.verify(token.value, token.hash)).toBe(true);
    expect(ConnectionToken.verify("wrong", token.hash)).toBe(false);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter @repo/contexts run test -- --testPathPattern=connection-token`
Expected: FAIL

- [ ] **Step 5: Implement ConnectionToken**

```typescript
// connection-token.ts
import { createHash, randomBytes } from "node:crypto";

export class ConnectionToken {
  private constructor(
    readonly value: string,
    readonly hash: string,
    readonly prefix: string,
  ) {}

  static generate(): ConnectionToken {
    const raw = "af_" + randomBytes(32).toString("base64url");
    const hash = createHash("sha256").update(raw).digest("hex");
    const prefix = raw.substring(0, 11);
    return new ConnectionToken(raw, hash, prefix);
  }

  static hashValue(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  static verify(value: string, hash: string): boolean {
    return ConnectionToken.hashValue(value) === hash;
  }

  static fromStored(hash: string, prefix: string): ConnectionToken {
    return new ConnectionToken("", hash, prefix);
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm --filter @repo/contexts run test -- --testPathPattern=connection-token`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/contexts/src/agents/domain/value-objects/
git commit -m "feat(agents): add agent value objects (type, status, connection token)"
```

### Task 2: Agent Entity

**Files:**
- Create: `packages/contexts/src/agents/domain/entities/agent.ts`
- Create: `packages/contexts/src/agents/domain/entities/agent.test.ts`
- Create: `packages/contexts/src/agents/domain/errors/agent-not-found.error.ts`
- Create: `packages/contexts/src/agents/domain/errors/invalid-connection-token.error.ts`
- Create: `packages/contexts/src/agents/domain/events/agent-created.event.ts`

- [ ] **Step 1: Create domain errors**

```typescript
// agent-not-found.error.ts
import { DomainError } from "../../../_shared/domain/errors/domain-error";

export class AgentNotFoundError extends DomainError {
  readonly code = "AGENT_NOT_FOUND";
  constructor(id: string) {
    super(`Agent "${id}" not found`);
  }
}

// invalid-connection-token.error.ts
import { DomainError } from "../../../_shared/domain/errors/domain-error";

export class InvalidConnectionTokenError extends DomainError {
  readonly code = "INVALID_CONNECTION_TOKEN";
  constructor() {
    super("Invalid or expired connection token");
  }
}
```

- [ ] **Step 2: Create AgentCreatedEvent**

```typescript
// agent-created.event.ts
import { DomainEvent } from "../../../_shared/domain/events/domain-event";

export class AgentCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = "agents.agent.created";
  constructor(
    readonly agentId: string,
    readonly organizationId: string,
    readonly name: string,
    readonly type: string,
  ) {
    super(AgentCreatedEvent.EVENT_NAME, agentId);
  }
}
```

- [ ] **Step 3: Write failing test for Agent entity**

Test should cover: create, updateName, markActive, markInactive, regenerateToken, toPrimitives. Follow the same encapsulation pattern as Organization entity (no public getters for data, use behavioral methods + toPrimitives).

- [ ] **Step 4: Implement Agent entity**

Follow same pattern as `packages/contexts/src/iam/domain/entities/organization.ts`:
- Private constructor, static `create` factory
- Private fields, behavioral getters (`isActive`, `isInactive`, `canManage(userId)`)
- `toPrimitives()` for serialization
- `updateName(name)`, `markActive()`, `markInactive()`, `updateLastSeen()`

- [ ] **Step 5: Run tests, verify pass, commit**

```bash
git commit -m "feat(agents): add Agent entity with domain errors and events"
```

### Task 3: Agent Repository Port + In-Memory Implementation

**Files:**
- Create: `packages/contexts/src/agents/ports/repositories/agent-repository.ts`
- Create: `packages/contexts/src/agents/infrastructure/persistence/in-memory-agent.repository.ts`

- [ ] **Step 1: Define AgentRepository interface**

```typescript
export interface AgentRepository {
  findById(id: string): Promise<Agent | null>;
  findByOrganizationId(orgId: string): Promise<Agent[]>;
  findByTokenHash(tokenHash: string): Promise<Agent | null>;
  save(agent: Agent): Promise<void>;
  delete(id: string): Promise<void>;
}
```

- [ ] **Step 2: Implement InMemoryAgentRepository**

Follow pattern from `in-memory-organization-repository.ts`.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(agents): add AgentRepository port and in-memory implementation"
```

### Task 4: Agent Use Cases

**Files:**
- Create: `packages/contexts/src/agents/application/use-cases/create-agent.ts` + test
- Create: `packages/contexts/src/agents/application/use-cases/list-agents.ts` + test
- Create: `packages/contexts/src/agents/application/use-cases/get-agent.ts` + test
- Create: `packages/contexts/src/agents/application/use-cases/update-agent.ts` + test
- Create: `packages/contexts/src/agents/application/use-cases/delete-agent.ts` + test
- Create: `packages/contexts/src/agents/application/use-cases/regenerate-token.ts` + test
- Create: `packages/contexts/src/agents/application/use-cases/validate-connection-token.ts` + test

For each use case, follow TDD:
1. Write failing test with InMemoryAgentRepository
2. Implement use case
3. Verify test passes

Key behaviors:
- `CreateAgent`: receives userId + organizationId, verifies user is owner/admin via org repo, generates ConnectionToken, returns Agent + raw token (shown once)
- `ValidateConnectionToken`: hashes input, looks up by hash, returns agent ID + org ID
- `RegenerateToken`: verifies user is owner/admin, generates new token, invalidates old hash
- `UpdateAgent`: verifies user is owner/admin before allowing rename
- `DeleteAgent`: verifies user is owner only, soft delete (keep for run history)
- `ListAgents`: filters by organizationId
- `GetAgent`: verifies agent belongs to user's org

**Authorization:** Use cases that mutate agents receive `userId` and check the user's org role via a read-only method on the agent repository or an injected authorization port. Follow the same pattern as `CreateOrganization` which receives `createdBy`.

- [ ] **Step 1-14: TDD for each use case (2 steps per use case)**

- [ ] **Step 15: Create agents/index.ts with all exports**

Follow pattern from `packages/contexts/src/iam/index.ts`.

- [ ] **Step 16: Commit**

```bash
git commit -m "feat(agents): add all agent use cases with tests"
```

### Task 5: Supabase Agent Repository + Migration

**Files:**
- Create: `supabase/migrations/006_agents_schema.sql`
- Create: `packages/contexts/src/agents/infrastructure/persistence/supabase-agent.repository.ts`

- [ ] **Step 1: Create migration**

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  token_hash TEXT NOT NULL,
  token_prefix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  last_seen_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_token_hash ON agents(token_hash);
```

- [ ] **Step 2: Implement SupabaseAgentRepository**

Follow pattern from `supabase-organization.repository.ts`. Map between domain entity and DB columns.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(agents): add Supabase migration and repository"
```

---

## Workstream B: Monitoring Context (Domain + Application + Infrastructure)

### Task 6: Run Entity + Value Objects

**Files:**
- Create: `packages/contexts/src/monitoring/domain/entities/run.ts` + test
- Create: `packages/contexts/src/monitoring/domain/value-objects/run-status.ts`
- Create: `packages/contexts/src/monitoring/domain/errors/run-not-found.error.ts`
- Create: `packages/contexts/src/monitoring/domain/events/run-completed.event.ts`
- Create: `packages/contexts/src/monitoring/domain/events/run-failed.event.ts`
- Create: `packages/contexts/src/monitoring/domain/read-models/agent-metrics.ts`

- [ ] **Step 1: Create RunStatus enum**
- [ ] **Step 2: Create Run entity with tests** — fields: id, agentId, externalRunId, status, startedAt, completedAt, durationMs, tokensUsed, cost, metadata, error. Methods: start(), complete(metrics), fail(error), toPrimitives()
- [ ] **Step 3: Create AgentMetrics read model** — totalRuns, successRate, avgDurationMs, totalCost, activeRuns
- [ ] **Step 4: Commit**

### Task 7: Run Repository + Use Cases

**Files:**
- Create: `packages/contexts/src/monitoring/ports/repositories/run-repository.ts`
- Create: `packages/contexts/src/monitoring/infrastructure/persistence/in-memory-run.repository.ts`
- Create: `packages/contexts/src/monitoring/application/use-cases/ingest-event.ts` + test
- Create: `packages/contexts/src/monitoring/application/use-cases/list-runs.ts` + test
- Create: `packages/contexts/src/monitoring/application/use-cases/get-run.ts` + test
- Create: `packages/contexts/src/monitoring/application/use-cases/get-agent-metrics.ts` + test
- Create: `packages/contexts/src/monitoring/application/use-cases/get-dashboard-metrics.ts` + test
- Create: `packages/contexts/src/monitoring/index.ts`

Key behaviors:
- `IngestEvent`: handles run.started/completed/failed, creates or updates Run entity, idempotent
- `ListRuns`: paginated, sorted by most recent, filtered by agentId
- `GetRun`: returns a single run by ID
- `GetAgentMetrics`: aggregates runs for a single agent (total runs, success rate, avg duration, cost)
- `GetDashboardMetrics`: aggregates across all agents in an org (total agents, active runs, avg response time) — used by the dashboard page

- [ ] **Step 1-8: TDD for each use case**
- [ ] **Step 7: Create monitoring/index.ts**
- [ ] **Step 8: Commit**

### Task 8: Supabase Run Repository + Migration

**Files:**
- Create: `supabase/migrations/007_runs_schema.sql`
- Create: `packages/contexts/src/monitoring/infrastructure/persistence/supabase-run.repository.ts`

- [ ] **Step 1: Create migration**

```sql
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  external_run_id TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  metadata JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTE: No FK to agents table. The monitoring context treats agent_id as a plain
-- string per DDD context boundaries. Orphaned runs after agent deletion are acceptable.

CREATE INDEX idx_runs_agent ON runs(agent_id);
CREATE INDEX idx_runs_agent_started ON runs(agent_id, started_at DESC);
CREATE UNIQUE INDEX idx_runs_agent_external ON runs(agent_id, external_run_id);
```

- [ ] **Step 2: Implement SupabaseRunRepository**
- [ ] **Step 3: Commit**

---

## Workstream C: Contracts + API Wiring

### Task 9: Contracts

**Files:**
- Create: `packages/contracts/src/agents/agents.ts`
- Create: `packages/contracts/src/agents/runs.ts`
- Create: `packages/contracts/src/agents/index.ts`

- [ ] **Step 1: Create agent schemas**

```typescript
// agents.ts
export const CreateAgentRequestSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["claude", "manus", "custom"]),
});

export const AgentResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  tokenPrefix: z.string(),
  lastSeenAt: z.string().nullable(),
  createdAt: z.string(),
});

// Also: UpdateAgentRequest, AgentListItemResponse, AgentWithTokenResponse
```

- [ ] **Step 2: Create run/ingest schemas**

```typescript
// runs.ts
export const IngestEventRequestSchema = z.object({
  event: z.enum(["run.started", "run.completed", "run.failed"]),
  runId: z.string().min(1),
  timestamp: z.string().optional(),
  data: z.object({
    durationMs: z.number().optional(),
    tokensUsed: z.number().optional(),
    cost: z.number().optional(),
    error: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }).optional(),
});

// Also: RunResponse, AgentMetricsResponse, PaginatedRunsResponse
```

- [ ] **Step 3: Commit**

### Task 10: API Controllers + Module Wiring

**Files:**
- Create: `apps/api/src/agents/controllers/agents.controller.ts` + test
- Create: `apps/api/src/agents/controllers/ingest.controller.ts` + test
- Create: `apps/api/src/agents/controllers/runs.controller.ts`
- Create: `apps/api/src/agents/guards/connection-token.guard.ts`
- Create: `apps/api/src/agents/agents.module.ts`
- Create: `apps/api/src/agents/test-agents.module.ts`
- Modify: `apps/api/src/app.module.ts` — import AgentsModule
- Modify: `apps/api/src/common/filters/domain-error.filter.ts` — add AGENT_NOT_FOUND, INVALID_CONNECTION_TOKEN to status map

Key points:
- `AgentsController`: JWT auth + org membership guard, CRUD operations on agents. All endpoints resolve `organizationId` from the authenticated user's current org context. `POST /agents` receives `organizationId` in body. `GET /agents` filters by org. `PATCH/DELETE /agents/:id` verifies agent belongs to user's org. Delete is owner-only.
- `IngestController`: ConnectionToken auth (custom guard), POST /ingest. Updates agent `lastSeenAt` and status to `active`.
- `RunsController`: JWT auth, GET /agents/:id/runs (paginated), GET /agents/:id/metrics
- `ConnectionTokenGuard`: extracts Bearer token, calls ValidateConnectionToken use case, attaches agentId + organizationId to request

- [ ] **Step 1-8: Implement controllers, guard, module, tests**
- [ ] **Step 9: Commit**

---

## Workstream D: Web Frontend

### Task 11: API Client + Hooks

**Files:**
- Modify: `apps/web/lib/api-client.ts` — add agents and runs endpoints
- Create: `apps/web/hooks/use-agents.ts`
- Create: `apps/web/hooks/use-agent-detail.ts`
- Create: `apps/web/hooks/use-agent-runs.ts`
- Create: `apps/web/hooks/use-create-agent-form.ts`
- Create: `apps/web/hooks/use-agent-settings.ts`

- [ ] **Step 1: Add typed API methods**

```typescript
// In api-client.ts, add to api object:
agents: {
  list: (orgId: string) => get<AgentListItemResponse[]>(`/agents?orgId=${orgId}`),
  create: (data: CreateAgentRequest) => post<AgentWithTokenResponse>("/agents", data),
  get: (id: string) => get<AgentResponse>(`/agents/${id}`),
  update: (id: string, data: UpdateAgentRequest) => patch<AgentResponse>(`/agents/${id}`, data),
  delete: (id: string) => del<void>(`/agents/${id}`),
  regenerateToken: (id: string) => post<AgentWithTokenResponse>(`/agents/${id}/regenerate-token`),
  runs: (id: string, page?: number) => get<PaginatedRunsResponse>(`/agents/${id}/runs?page=${page ?? 1}`),
  metrics: (id: string) => get<AgentMetricsResponse>(`/agents/${id}/metrics`),
},
```

- [ ] **Step 2: Create hooks following existing patterns**
- [ ] **Step 3: Commit**

### Task 12: Web Pages + Components

**Files:**
- Create: `apps/web/app/(dashboard)/agents/page.tsx`
- Create: `apps/web/app/(dashboard)/agents/new/page.tsx`
- Create: `apps/web/app/(dashboard)/agents/[id]/page.tsx`
- Create: `apps/web/app/(dashboard)/agents/[id]/settings/page.tsx`
- Create: `apps/web/components/features/agents-list/agents-list-page.tsx`
- Create: `apps/web/components/features/connect-agent/connect-agent-form.tsx`
- Create: `apps/web/components/features/connect-agent/token-display.tsx`
- Create: `apps/web/components/features/agent-detail/agent-detail-page.tsx`
- Create: `apps/web/components/features/agent-detail/runs-table.tsx`
- Create: `apps/web/components/features/agent-settings/agent-settings-page.tsx`
- Modify: `apps/web/components/layout/sidebar.tsx` — enable Agents nav item

Reference mockups in `docs/mockups/agents/` for exact design.

- [ ] **Step 1-5: Create pages (thin wrappers) and feature components (pure UI)**
- [ ] **Step 6: Enable Agents in sidebar**
- [ ] **Step 7: Commit**

---

## Workstream E: MCP Server

### Task 12b: MCP Server Implementation

**Files:**
- Create: `apps/api/src/mcp/mcp.controller.ts`
- Create: `apps/api/src/mcp/mcp.module.ts`
- Modify: `apps/api/src/app.module.ts` — import McpModule

**Dependency:** Workstreams A, B, C must be merged first.

The MCP server exposes tools that agents auto-discover. Uses the `@modelcontextprotocol/sdk` package. Authentication via connection token in the Authorization header (same as HTTP ingest).

**Tools to implement:**

| Tool | Use Case | Parameters |
|---|---|---|
| `report_run_started` | IngestEvent (run.started) | runId, metadata? |
| `report_run_completed` | IngestEvent (run.completed) | runId, durationMs?, tokensUsed?, cost?, metadata? |
| `report_run_failed` | IngestEvent (run.failed) | runId, error, durationMs?, tokensUsed?, metadata? |
| `get_my_recent_runs` | ListRuns (filtered by agent) | limit? |
| `get_my_status` | GetAgent + GetAgentMetrics | — |

- [ ] **Step 1: Install MCP SDK**

```bash
pnpm --filter api add @modelcontextprotocol/sdk
```

- [ ] **Step 2: Create MCP controller** — single `/mcp` endpoint that handles the MCP protocol. Authenticates via connection token, resolves agentId, then delegates to existing use cases.

- [ ] **Step 3: Create MCP module** — wires the controller with the agents and monitoring use cases.

- [ ] **Step 4: Write tests** — test each tool invocation resolves to the correct use case call.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add MCP server with agent reporting tools"
```

---

## Workstream F: Dashboard Metrics

### Task 12c: Wire Dashboard to Real Data

**Files:**
- Create: `apps/web/hooks/use-dashboard-metrics.ts`
- Modify: `apps/web/app/(dashboard)/dashboard/page.tsx` — replace placeholder cards with real data
- Modify: `apps/api/src/agents/controllers/runs.controller.ts` — add GET /dashboard/metrics endpoint

The dashboard page currently shows hardcoded "—" values. Wire it to `GetDashboardMetrics` use case which aggregates across all agents in the user's current org.

- [ ] **Step 1: Add dashboard metrics API endpoint**
- [ ] **Step 2: Create hook**
- [ ] **Step 3: Update dashboard page to use hook**
- [ ] **Step 4: Commit**

---

## Workstream G: Profile Fixes (Change Password + Avatar)

### Task 13: Change Password

**Files:**
- Modify: `packages/contexts/src/iam/ports/services/auth-service.ts` — add changePassword method
- Modify: `packages/contexts/src/iam/infrastructure/services/supabase-auth.service.ts` — implement changePassword
- Create: `packages/contexts/src/iam/application/use-cases/change-password.ts` + test
- Create: `packages/contracts/src/iam/auth.ts` — add ChangePasswordRequestSchema
- Modify: `apps/api/src/iam/controllers/auth.controller.ts` — add PATCH /auth/password
- Create: `apps/web/hooks/use-change-password-form.ts`
- Create: `apps/web/components/features/change-password/change-password-form.tsx`
- Modify: `apps/web/components/features/edit-profile/edit-profile-form.tsx` — add change password section

- [ ] **Step 1-6: TDD for use case, add contract, controller, hook, UI**
- [ ] **Step 7: Commit**

### Task 14: Avatar Upload (Supabase Storage)

**Files:**
- Create: `supabase/migrations/008_storage_avatars.sql`
- Modify: `apps/web/lib/api-client.ts` — add avatar upload method
- Create: `apps/web/hooks/use-avatar-upload.ts`
- Create: `apps/web/components/features/avatar-upload/avatar-upload.tsx`
- Modify: `apps/web/components/features/edit-profile/edit-profile-form.tsx` — add avatar section

- [ ] **Step 1: Create storage migration**

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

- [ ] **Step 2: Create upload hook + component**
- [ ] **Step 3: Commit**

---

## Workstream H: Seed + E2E Tests

### Task 15: Seed Script Update

**Files:**
- Modify: `supabase/seed.ts` — add agents and runs test data

- [ ] **Step 1: Add agents to seed**

Create 3 agents for Acme Corp (Claude active, Manus active, Custom inactive) and seed 10-20 runs across them with mixed statuses.

- [ ] **Step 2: Commit**

### Task 16: E2E Tests

**Files:**
- Create: `apps/web/e2e/agents.test.ts`
- Create: `apps/web/e2e/agent-detail.test.ts`

Tests to cover:
- Navigate to agents list → see seeded agents
- Create new agent → see token → agent appears in list
- Click agent → see runs table
- Agent settings → rename → verify
- Agent settings → delete → removed from list
- Profile → change password
- Profile → upload avatar (if feasible in E2E)

- [ ] **Step 1-7: Write E2E tests**
- [ ] **Step 8: Commit**

---

## Parallelization Strategy

| Workstream | Agent | Dependencies | Isolation |
|---|---|---|---|
| A: Agents Context | Agent 1 | None | worktree |
| B: Monitoring Context | Agent 2 | None | worktree |
| C: Contracts + API | Agent 3 | After A + B merge | worktree |
| D: Web Frontend | Agent 4 | After C merge | worktree |
| E: MCP Server | Agent 5 | After A + B + C merge | worktree |
| F: Dashboard Metrics | Agent 6 | After B + C merge | worktree |
| G: Profile Fixes | Agent 7 | None (independent) | worktree |
| H: Seed + E2E | Agent 8 | After all merge | worktree |

**Phase 1 (parallel):** Agents 1, 2, 7 — no shared files.
**Phase 2 (after phase 1):** Agents 3 — needs context exports from A + B.
**Phase 3 (after phase 2):** Agents 4, 5, 6 — need API endpoints and contracts.
**Phase 4 (after all):** Agent 8 — seed + E2E needs everything wired.

## Review Gates

Before any agent pushes to remote:
1. All unit tests pass (`pnpm -r run test`)
2. Build passes (`pnpm run build`)
3. User reviews the diff locally
4. User confirms merge to feature branch
