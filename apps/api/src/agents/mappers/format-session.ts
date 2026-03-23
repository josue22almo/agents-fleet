import type { SessionPrimitives } from "@repo/contexts/monitoring";

export function formatSession(session: SessionPrimitives) {
  return {
    id: session.id,
    agentId: session.agentId,
    name: session.name,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    totalDurationMs: session.totalDurationMs,
    totalTokensUsed: session.totalTokensUsed,
    totalCost: session.totalCost,
    runCount: session.runCount,
    metadata: session.metadata,
  };
}

export function formatSessionListItem(session: SessionPrimitives) {
  return {
    id: session.id,
    agentId: session.agentId,
    name: session.name,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    totalDurationMs: session.totalDurationMs,
    totalCost: session.totalCost,
    runCount: session.runCount,
  };
}
