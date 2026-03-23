import type { RunPrimitives } from "@repo/contexts/monitoring";

export function formatRun(run: RunPrimitives) {
  return {
    id: run.id,
    agentId: run.agentId,
    externalRunId: run.externalRunId,
    sessionId: run.sessionId,
    status: run.status,
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt?.toISOString() ?? null,
    durationMs: run.durationMs,
    tokensUsed: run.tokensUsed,
    cost: run.cost,
    error: run.error,
    metadata: run.metadata,
  };
}
