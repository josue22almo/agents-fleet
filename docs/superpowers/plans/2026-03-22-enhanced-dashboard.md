# Enhanced Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add distribution charts, agent comparison table, real-time activity feed, tool call tracking, and agent usage stats to the dashboard and agent detail pages.

**Architecture:** Extends the monitoring context with two new use cases (GetDashboardChartData, GetAgentComparison) and a new ToolCall entity. Frontend uses Recharts for charts and EventSource for SSE. Agent detail gets charts, a Tools tab, and usage stats. All new data flows through the existing ingest endpoint.

**Tech Stack:** Recharts, SSE (NestJS @Sse), Vitest (TDD), Zod contracts, TanStack Query

**PRD:** `docs/prd/enhanced-dashboard.md`
**Mockups:** `docs/mockups/enhanced-dashboard/`

---

## File Structure

### Backend (monitoring context)
```
packages/contexts/src/monitoring/
  application/use-cases/
    get-dashboard-chart-data.ts          # NEW — aggregates runs into chart buckets
    get-dashboard-chart-data.test.ts     # NEW
    get-agent-comparison.ts              # NEW — compares agents side by side
    get-agent-comparison.test.ts         # NEW
    get-agent-usage-stats.ts             # NEW — monthly usage per agent
    get-agent-usage-stats.test.ts        # NEW
  domain/entities/
    tool-call.ts                         # NEW — ToolCall entity
    tool-call.test.ts                    # NEW
  ports/repositories/
    tool-call-repository.ts              # NEW — interface
  infrastructure/persistence/
    in-memory-tool-call-repository.ts    # NEW
    supabase-tool-call.repository.ts     # NEW
  index.ts                              # MODIFY — add exports
```

### Contracts
```
packages/contracts/src/agents/
  runs.ts                               # MODIFY — add chart/comparison/usage schemas
```

### API
```
apps/api/src/agents/controllers/
  runs.controller.ts                    # MODIFY — add chart/comparison/usage/tool endpoints
  events.controller.ts                  # NEW — SSE endpoint
apps/api/src/agents/
  agents.module.ts                      # MODIFY — wire new repos + controllers
  test-agents.module.ts                 # MODIFY — wire in-memory repos
```

### Frontend
```
apps/web/
  components/features/
    dashboard-charts/
      run-duration-histogram.tsx         # NEW
      tokens-by-agent-chart.tsx          # NEW
      error-breakdown-chart.tsx          # NEW
    dashboard-comparison/
      agent-comparison-table.tsx         # NEW
    dashboard-activity/
      activity-feed.tsx                  # NEW
    dashboard-tools/
      top-tools-card.tsx                 # NEW
    agent-detail/
      agent-charts.tsx                   # NEW — agent-specific charts
      tool-usage-table.tsx               # NEW
      agent-usage-stats.tsx              # NEW
      agent-detail-page.tsx              # MODIFY — add charts, tools tab, usage
  hooks/
    use-dashboard-charts.ts              # NEW
    use-agent-comparison.ts              # NEW
    use-activity-feed.ts                 # NEW
    use-agent-tool-calls.ts              # NEW
    use-agent-usage-stats.ts             # NEW
  lib/
    api-client.ts                        # MODIFY — add new API methods
  app/(dashboard)/dashboard/
    page.tsx                             # MODIFY — integrate all dashboard sections
```

### Database
```
supabase/migrations/
  013_tool_calls_schema.sql              # NEW
```

---

## Phase 1: Distribution Charts + Agent Comparison (backend)

These share the same `findByAgentIds` method and can be built together.

### Task 1: GetDashboardChartData use case

**Files:**
- Create: `packages/contexts/src/monitoring/application/use-cases/get-dashboard-chart-data.test.ts`
- Create: `packages/contexts/src/monitoring/application/use-cases/get-dashboard-chart-data.ts`
- Modify: `packages/contexts/src/monitoring/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// get-dashboard-chart-data.test.ts
import { describe, it, expect } from "vitest";
import { createTestDeps } from "./_test-helpers";
import { GetDashboardChartData } from "./get-dashboard-chart-data";
import { Run } from "../../domain/entities/run";
import { RunStatus } from "../../domain/value-objects/run-status";

function makeRun(overrides: Partial<{ id: string; agentId: string; durationMs: number | null; tokensUsed: number | null; error: string | null; status: RunStatus }>) {
  return Run.create({
    id: overrides.id ?? crypto.randomUUID(),
    agentId: overrides.agentId ?? "a1",
    externalRunId: crypto.randomUUID(),
    sessionId: null,
    status: overrides.status ?? RunStatus.COMPLETED,
    startedAt: new Date(),
    completedAt: new Date(),
    durationMs: overrides.durationMs ?? 1000,
    tokensUsed: overrides.tokensUsed ?? 100,
    cost: 0.01,
    metadata: null,
    error: overrides.error ?? null,
    createdAt: new Date(),
  });
}

describe("GetDashboardChartData", () => {
  it("returns duration histogram buckets", async () => {
    const deps = createTestDeps();
    const uc = new GetDashboardChartData(deps.runRepo);

    await deps.runRepo.save(makeRun({ durationMs: 500 }));
    await deps.runRepo.save(makeRun({ durationMs: 1500 }));
    await deps.runRepo.save(makeRun({ durationMs: 3500 }));

    const result = await uc.execute({ agentIds: ["a1"] });

    expect(result.durationHistogram).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bucket: "<1s", count: 1 }),
        expect.objectContaining({ bucket: "1-3s", count: 1 }),
        expect.objectContaining({ bucket: "3-5s", count: 1 }),
      ]),
    );
  });

  it("returns tokens grouped by agent", async () => {
    const deps = createTestDeps();
    const uc = new GetDashboardChartData(deps.runRepo);

    await deps.runRepo.save(makeRun({ agentId: "a1", tokensUsed: 100 }));
    await deps.runRepo.save(makeRun({ agentId: "a1", tokensUsed: 200 }));
    await deps.runRepo.save(makeRun({ agentId: "a2", tokensUsed: 50 }));

    const result = await uc.execute({ agentIds: ["a1", "a2"] });

    expect(result.tokensByAgent).toEqual([
      { agentId: "a1", tokens: 300 },
      { agentId: "a2", tokens: 50 },
    ]);
  });

  it("groups errors by type", async () => {
    const deps = createTestDeps();
    const uc = new GetDashboardChartData(deps.runRepo);

    await deps.runRepo.save(makeRun({ status: RunStatus.FAILED, error: "Rate limit", durationMs: null, tokensUsed: null }));
    await deps.runRepo.save(makeRun({ status: RunStatus.FAILED, error: "Rate limit", durationMs: null, tokensUsed: null }));
    await deps.runRepo.save(makeRun({ status: RunStatus.FAILED, error: "Timeout", durationMs: null, tokensUsed: null }));

    const result = await uc.execute({ agentIds: ["a1"] });

    expect(result.errorBreakdown).toEqual([
      { type: "Rate limit", count: 2 },
      { type: "Timeout", count: 1 },
    ]);
  });

  it("returns empty arrays when no runs", async () => {
    const deps = createTestDeps();
    const uc = new GetDashboardChartData(deps.runRepo);

    const result = await uc.execute({ agentIds: ["a1"] });

    expect(result.durationHistogram).toEqual([]);
    expect(result.tokensByAgent).toEqual([]);
    expect(result.errorBreakdown).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/contexts run test -- --grep "GetDashboardChartData"`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```typescript
// get-dashboard-chart-data.ts
import type { RunRepository } from "../../ports/repositories/run-repository";

interface DurationBucket { bucket: string; count: number; }
interface TokensByAgent { agentId: string; tokens: number; }
interface ErrorCount { type: string; count: number; }

export interface DashboardChartData {
  durationHistogram: DurationBucket[];
  tokensByAgent: TokensByAgent[];
  errorBreakdown: ErrorCount[];
}

const BUCKETS = [
  { label: "<1s", max: 1000 },
  { label: "1-3s", max: 3000 },
  { label: "3-5s", max: 5000 },
  { label: "5-10s", max: 10000 },
  { label: ">10s", max: Infinity },
];

export class GetDashboardChartData {
  constructor(private readonly runRepo: RunRepository) {}

  async execute(params: { agentIds: string[] }): Promise<DashboardChartData> {
    const runs = await this.runRepo.findByAgentIds(params.agentIds);
    const primitives = runs.map((r) => r.toPrimitives());

    return {
      durationHistogram: this.buildHistogram(primitives),
      tokensByAgent: this.buildTokensByAgent(primitives),
      errorBreakdown: this.buildErrors(primitives),
    };
  }

  private buildHistogram(runs: Array<{ durationMs: number | null }>): DurationBucket[] {
    const counts = new Map<string, number>();
    for (const run of runs) {
      if (run.durationMs === null) continue;
      for (const b of BUCKETS) {
        if (run.durationMs <= b.max) {
          counts.set(b.label, (counts.get(b.label) ?? 0) + 1);
          break;
        }
      }
    }
    return BUCKETS.map((b) => ({ bucket: b.label, count: counts.get(b.label) ?? 0 }))
      .filter((b) => b.count > 0);
  }

  private buildTokensByAgent(runs: Array<{ agentId: string; tokensUsed: number | null }>): TokensByAgent[] {
    const totals = new Map<string, number>();
    for (const r of runs) {
      if (r.tokensUsed === null) continue;
      totals.set(r.agentId, (totals.get(r.agentId) ?? 0) + r.tokensUsed);
    }
    return Array.from(totals.entries())
      .map(([agentId, tokens]) => ({ agentId, tokens }))
      .sort((a, b) => b.tokens - a.tokens);
  }

  private buildErrors(runs: Array<{ error: string | null }>): ErrorCount[] {
    const counts = new Map<string, number>();
    for (const r of runs) {
      if (!r.error) continue;
      counts.set(r.error, (counts.get(r.error) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/contexts run test`
Expected: PASS

- [ ] **Step 5: Export and commit**

Add to `packages/contexts/src/monitoring/index.ts`:
```typescript
export { GetDashboardChartData } from "./application/use-cases/get-dashboard-chart-data";
```

```bash
git add packages/contexts/src/monitoring/
git commit -m "feat(monitoring): add GetDashboardChartData use case"
```

---

### Task 2: GetAgentComparison use case

**Files:**
- Create: `packages/contexts/src/monitoring/application/use-cases/get-agent-comparison.test.ts`
- Create: `packages/contexts/src/monitoring/application/use-cases/get-agent-comparison.ts`
- Modify: `packages/contexts/src/monitoring/index.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// get-agent-comparison.test.ts
import { describe, it, expect } from "vitest";
import { createTestDeps } from "./_test-helpers";
import { GetAgentComparison } from "./get-agent-comparison";
import { Run } from "../../domain/entities/run";
import { RunStatus } from "../../domain/value-objects/run-status";

function makeRun(agentId: string, status: RunStatus, durationMs?: number, tokensUsed?: number, cost?: number) {
  return Run.create({
    id: crypto.randomUUID(), agentId, externalRunId: crypto.randomUUID(), sessionId: null,
    status, startedAt: new Date(), completedAt: status !== RunStatus.RUNNING ? new Date() : null,
    durationMs: durationMs ?? null, tokensUsed: tokensUsed ?? null, cost: cost ?? null,
    metadata: null, error: status === RunStatus.FAILED ? "error" : null, createdAt: new Date(),
  });
}

describe("GetAgentComparison", () => {
  it("compares multiple agents", async () => {
    const deps = createTestDeps();
    const uc = new GetAgentComparison(deps.runRepo);

    await deps.runRepo.save(makeRun("a1", RunStatus.COMPLETED, 1000, 100, 0.01));
    await deps.runRepo.save(makeRun("a1", RunStatus.COMPLETED, 2000, 200, 0.02));
    await deps.runRepo.save(makeRun("a1", RunStatus.FAILED));
    await deps.runRepo.save(makeRun("a2", RunStatus.COMPLETED, 3000, 300, 0.03));

    const result = await uc.execute({ agentIds: ["a1", "a2"] });

    expect(result).toHaveLength(2);
    expect(result[0].agentId).toBe("a1"); // sorted by totalRuns desc
    expect(result[0].totalRuns).toBe(3);
    expect(result[0].completedRuns).toBe(2);
    expect(result[0].failedRuns).toBe(1);
    expect(result[0].successRate).toBeCloseTo(66.7, 0);
    expect(result[0].avgDurationMs).toBe(1500);
    expect(result[0].totalTokensUsed).toBe(300);
    expect(result[0].totalCost).toBeCloseTo(0.03);
  });

  it("returns empty array when no runs", async () => {
    const deps = createTestDeps();
    const uc = new GetAgentComparison(deps.runRepo);
    const result = await uc.execute({ agentIds: ["a1"] });
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2-4: TDD cycle** (same pattern as Task 1)

- [ ] **Step 5: Commit**

```bash
git add packages/contexts/src/monitoring/
git commit -m "feat(monitoring): add GetAgentComparison use case"
```

---

### Task 3: GetAgentUsageStats use case

**Files:**
- Create: `packages/contexts/src/monitoring/application/use-cases/get-agent-usage-stats.test.ts`
- Create: `packages/contexts/src/monitoring/application/use-cases/get-agent-usage-stats.ts`

Returns current month stats + monthly history for a single agent. Groups runs by month.

- [ ] **Step 1-5: TDD cycle + commit**

```bash
git commit -m "feat(monitoring): add GetAgentUsageStats use case"
```

---

## Phase 2: Contracts + API endpoints

### Task 4: Add Zod schemas

**Files:**
- Modify: `packages/contracts/src/agents/runs.ts`

- [ ] **Step 1: Add schemas**

```typescript
// Add to runs.ts
export const DashboardChartDataResponseSchema = z.object({
  durationHistogram: z.array(z.object({ bucket: z.string(), count: z.number() })),
  tokensByAgent: z.array(z.object({ agentId: z.string(), tokens: z.number() })),
  errorBreakdown: z.array(z.object({ type: z.string(), count: z.number() })),
});
export type DashboardChartDataResponse = z.infer<typeof DashboardChartDataResponseSchema>;

export const AgentComparisonRowSchema = z.object({
  agentId: z.string(),
  totalRuns: z.number(),
  completedRuns: z.number(),
  failedRuns: z.number(),
  successRate: z.number(),
  avgDurationMs: z.number(),
  totalTokensUsed: z.number(),
  totalCost: z.number(),
});
export const AgentComparisonResponseSchema = z.array(AgentComparisonRowSchema);
export type AgentComparisonResponse = z.infer<typeof AgentComparisonResponseSchema>;

export const AgentUsageStatsResponseSchema = z.object({
  currentPeriod: z.object({ period: z.string(), runs: z.number(), tokens: z.number(), cost: z.number(), successRate: z.number() }),
  history: z.array(z.object({ period: z.string(), runs: z.number(), tokens: z.number(), cost: z.number(), successRate: z.number() })),
});
export type AgentUsageStatsResponse = z.infer<typeof AgentUsageStatsResponseSchema>;

export const ToolCallResponseSchema = z.object({
  toolName: z.string(),
  calls: z.number(),
  avgDurationMs: z.number(),
  successRate: z.number(),
});
export const ToolCallListResponseSchema = z.array(ToolCallResponseSchema);
export type ToolCallListResponse = z.infer<typeof ToolCallListResponseSchema>;
```

- [ ] **Step 2: Build to verify**

Run: `pnpm run build`

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(contracts): add chart, comparison, usage, and tool call schemas"
```

---

### Task 5: API endpoints

**Files:**
- Modify: `apps/api/src/agents/controllers/runs.controller.ts`

- [ ] **Step 1: Add endpoints**

```typescript
@Get("dashboard/charts")
@UseGuards(JwtAuthGuard)
async handleDashboardCharts(@CurrentUser() user: AuthenticatedUser, @Query("organizationId") orgId: string) {
  const agentIds = await this.getAgentIdsForOrg(orgId, user.id);
  const uc = new GetDashboardChartData(this.runRepo);
  const result = await uc.execute({ agentIds });
  return DashboardChartDataResponseSchema.parse(result);
}

@Get("dashboard/comparison")
@UseGuards(JwtAuthGuard)
async handleDashboardComparison(@CurrentUser() user: AuthenticatedUser, @Query("organizationId") orgId: string) {
  const agentIds = await this.getAgentIdsForOrg(orgId, user.id);
  const uc = new GetAgentComparison(this.runRepo);
  const result = await uc.execute({ agentIds });
  return AgentComparisonResponseSchema.parse(result);
}

@Get("agents/:id/usage")
@UseGuards(JwtAuthGuard)
async handleAgentUsage(@Param("id") agentId: string) {
  const uc = new GetAgentUsageStats(this.runRepo);
  const result = await uc.execute({ agentId });
  return AgentUsageStatsResponseSchema.parse(result);
}
```

- [ ] **Step 2: Build + test**

Run: `pnpm --filter api run test && pnpm run build`

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(api): add charts, comparison, and usage endpoints"
```

---

## Phase 3: Frontend — Dashboard charts + comparison

### Task 6: Install Recharts + create chart components

**Files:**
- Create: `apps/web/components/features/dashboard-charts/run-duration-histogram.tsx`
- Create: `apps/web/components/features/dashboard-charts/tokens-by-agent-chart.tsx`
- Create: `apps/web/components/features/dashboard-charts/error-breakdown-chart.tsx`
- Create: `apps/web/hooks/use-dashboard-charts.ts`
- Modify: `apps/web/lib/api-client.ts`

- [ ] **Step 1: Install Recharts**

```bash
pnpm --filter web add recharts
```

- [ ] **Step 2: Add API client methods**

```typescript
// Add to agents section in api-client.ts
dashboardCharts: (orgId: string) => get<DashboardChartDataResponse>(`/dashboard/charts?organizationId=${orgId}`),
dashboardComparison: (orgId: string) => get<AgentComparisonResponse>(`/dashboard/comparison?organizationId=${orgId}`),
agentUsage: (id: string) => get<AgentUsageStatsResponse>(`/agents/${id}/usage`),
```

- [ ] **Step 3: Create hooks**

```typescript
// use-dashboard-charts.ts
export function useDashboardCharts(orgId: string) {
  return useQuery({
    queryKey: ["dashboard-charts", orgId],
    queryFn: () => api.agents.dashboardCharts(orgId),
    enabled: !!orgId,
  });
}
```

```typescript
// use-agent-comparison.ts
export function useAgentComparison(orgId: string) {
  return useQuery({
    queryKey: ["dashboard-comparison", orgId],
    queryFn: () => api.agents.dashboardComparison(orgId),
    enabled: !!orgId,
  });
}
```

- [ ] **Step 4: Create chart components**

Each chart is a pure component receiving data as props. Uses Recharts with purple theme (fill="#8b5cf6").

- RunDurationHistogram: `<BarChart>` with vertical bars
- TokensByAgentChart: horizontal bars (custom div, not Recharts — simpler for horizontal)
- ErrorBreakdownChart: `<PieChart>` with donut style

- [ ] **Step 5: Create AgentComparisonTable**

Sortable table with shadcn Table. Client-side sort on column header click. Success rate colored green/yellow/red. Row links to agent detail.

- [ ] **Step 6: Integrate into dashboard page**

Add below the 4 metric cards:
- Charts row (2 cols): histogram + tokens by agent
- Charts row (2 cols): error breakdown + activity feed (placeholder)
- Comparison table (full width)
- Top tools card (full width)

- [ ] **Step 7: Build + verify**

Run: `pnpm run build`

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(web): add dashboard charts, comparison table, and top tools"
```

---

## Phase 4: Real-Time Activity Feed (SSE)

### Task 7: SSE endpoint

**Files:**
- Create: `apps/api/src/agents/controllers/events.controller.ts`
- Modify: `apps/api/src/agents/agents.module.ts`

- [ ] **Step 1: Create SSE controller**

NestJS `@Sse()` endpoint at `GET /dashboard/events?organizationId=xxx`. Subscribes to EventEmitter2 for `run.ingested`, `session.*` events. Filters by org's agent IDs. Returns Observable of MessageEvent.

- [ ] **Step 2: Create frontend hook + component**

```typescript
// use-activity-feed.ts — uses EventSource API
// activity-feed.tsx — scrollable list with colored dots per event type
```

- [ ] **Step 3: Integrate into dashboard**

Replace the placeholder with the live feed.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add real-time activity feed with SSE"
```

---

## Phase 5: Tool Call Tracking

### Task 8: ToolCall entity + repository

**Files:**
- Create: `packages/contexts/src/monitoring/domain/entities/tool-call.ts`
- Create: `packages/contexts/src/monitoring/domain/entities/tool-call.test.ts`
- Create: `packages/contexts/src/monitoring/ports/repositories/tool-call-repository.ts`
- Create: `packages/contexts/src/monitoring/infrastructure/persistence/in-memory-tool-call-repository.ts`
- Create: `packages/contexts/src/monitoring/infrastructure/persistence/supabase-tool-call.repository.ts`
- Create: `supabase/migrations/013_tool_calls_schema.sql`

- [ ] **Step 1-5: TDD cycle for entity + repo**

### Task 9: IngestToolCall use case + API

- [ ] **Step 1: Add `tool.called` event to IngestEvent**
- [ ] **Step 2: Add `report_tool_call` MCP tool**
- [ ] **Step 3: Add GET /agents/:id/tools endpoint**
- [ ] **Step 4: Create frontend ToolUsageTable component**
- [ ] **Step 5: Add Tools tab to agent detail page**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add tool call tracking with entity, ingest, and UI"
```

---

## Phase 6: Agent Detail Enhancements

### Task 10: Agent-specific charts + usage stats

**Files:**
- Create: `apps/web/components/features/agent-detail/agent-charts.tsx`
- Create: `apps/web/components/features/agent-detail/agent-usage-stats.tsx`
- Create: `apps/web/hooks/use-agent-usage-stats.ts`
- Modify: `apps/web/components/features/agent-detail/agent-detail-page.tsx`

- [ ] **Step 1: Create agent charts component**

Reuses the same chart components but with single-agent data (duration histogram + error breakdown + top tools bar).

- [ ] **Step 2: Create usage stats component**

Current period summary (tokens, cost, runs) + monthly history table.

- [ ] **Step 3: Add Tools tab to agent detail**

Tab navigation: Sessions | Runs | Tools. Tools tab shows ToolUsageTable.

- [ ] **Step 4: Add charts and usage below metrics cards**

3-column grid: duration, errors, top tools.
Usage section below tabs.

- [ ] **Step 5: Build + verify**

Run: `pnpm run build`

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(web): add charts, tools tab, and usage stats to agent detail"
```

---

## Verification

After all phases:
1. `pnpm -r run test` — all tests pass (expect ~310+ tests)
2. `pnpm run build` — build succeeds
3. Dashboard shows: 4 metric cards + 3 charts + activity feed + comparison table + top tools
4. Agent detail shows: 4 metric cards + 3 charts + Sessions/Runs/Tools tabs + usage stats
5. `POST /ingest` with `tool.called` event works
6. SSE feed updates live when events are ingested
