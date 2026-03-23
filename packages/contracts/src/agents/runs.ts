import { z } from "zod";

export const IngestEventRequestSchema = z.object({
  event: z.enum([
    "run.started",
    "run.completed",
    "run.failed",
    "session.started",
    "session.completed",
    "session.failed",
    "tool.called",
  ]),
  runId: z.string().min(1, "Run ID is required").optional(),
  sessionId: z.string().optional(),
  timestamp: z.string().optional(),
  data: z.object({
    name: z.string().optional(),
    durationMs: z.number().optional(),
    tokensUsed: z.number().optional(),
    cost: z.number().optional(),
    error: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    totalDurationMs: z.number().optional(),
    totalTokensUsed: z.number().optional(),
    totalCost: z.number().optional(),
    toolName: z.string().optional(),
    success: z.boolean().optional(),
  }).optional(),
});

export const RunResponseSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  externalRunId: z.string().nullable(),
  sessionId: z.string().nullable(),
  status: z.string(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  durationMs: z.number().nullable(),
  tokensUsed: z.number().nullable(),
  cost: z.number().nullable(),
  error: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
});

export const SessionResponseSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  name: z.string().nullable(),
  status: z.string(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  totalDurationMs: z.number().nullable(),
  totalTokensUsed: z.number().nullable(),
  totalCost: z.number().nullable(),
  runCount: z.number(),
  metadata: z.record(z.unknown()).nullable(),
});

export const SessionListItemResponseSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  name: z.string().nullable(),
  status: z.string(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  totalDurationMs: z.number().nullable(),
  totalCost: z.number().nullable(),
  runCount: z.number(),
});

export const PaginatedSessionsResponseSchema = z.object({
  data: z.array(SessionListItemResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const SessionWithRunsResponseSchema = z.object({
  session: SessionResponseSchema,
  runs: z.array(RunResponseSchema),
});

export const AgentMetricsResponseSchema = z.object({
  totalRuns: z.number(),
  successRate: z.number(),
  avgDurationMs: z.number(),
  totalCost: z.number(),
  activeRuns: z.number(),
});

export const DashboardMetricsResponseSchema = z.object({
  totalAgents: z.number(),
  activeRuns: z.number(),
  avgResponseTimeMs: z.number(),
  totalCost: z.number(),
});

export const PaginatedRunsResponseSchema = z.object({
  data: z.array(RunResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type IngestEventRequest = z.infer<typeof IngestEventRequestSchema>;
export type RunResponse = z.infer<typeof RunResponseSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type SessionListItemResponse = z.infer<typeof SessionListItemResponseSchema>;
export type PaginatedSessionsResponse = z.infer<typeof PaginatedSessionsResponseSchema>;
export type SessionWithRunsResponse = z.infer<typeof SessionWithRunsResponseSchema>;
export type AgentMetricsResponse = z.infer<typeof AgentMetricsResponseSchema>;
export type DashboardMetricsResponse = z.infer<typeof DashboardMetricsResponseSchema>;
export type PaginatedRunsResponse = z.infer<typeof PaginatedRunsResponseSchema>;

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

export const ToolCallSummarySchema = z.object({
  toolName: z.string(),
  calls: z.number(),
  avgDurationMs: z.number(),
  successRate: z.number(),
});
export const ToolCallSummaryResponseSchema = z.array(ToolCallSummarySchema);
export type ToolCallSummaryResponse = z.infer<typeof ToolCallSummaryResponseSchema>;
