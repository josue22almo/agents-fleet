import { z } from "zod";

export const IngestEventRequestSchema = z.object({
  event: z.enum(["run.started", "run.completed", "run.failed"]),
  runId: z.string().min(1, "Run ID is required"),
  timestamp: z.string().optional(),
  data: z.object({
    durationMs: z.number().optional(),
    tokensUsed: z.number().optional(),
    cost: z.number().optional(),
    error: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }).optional(),
});

export const RunResponseSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  externalRunId: z.string().nullable(),
  status: z.string(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  durationMs: z.number().nullable(),
  tokensUsed: z.number().nullable(),
  cost: z.number().nullable(),
  error: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
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
export type AgentMetricsResponse = z.infer<typeof AgentMetricsResponseSchema>;
export type DashboardMetricsResponse = z.infer<typeof DashboardMetricsResponseSchema>;
export type PaginatedRunsResponse = z.infer<typeof PaginatedRunsResponseSchema>;
