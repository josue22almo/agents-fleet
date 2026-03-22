import { AgentMetrics } from "../../domain/read-models/agent-metrics";
import { RunStatus } from "../../domain/value-objects/run-status";
import type { RunRepository } from "../../ports/repositories/run-repository";

interface DashboardMetrics {
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  totalCost: number;
  activeRuns: number;
}

export class GetDashboardMetrics {
  constructor(private readonly runRepo: RunRepository) {}

  async execute(agentIds: string[]): Promise<DashboardMetrics> {
    if (agentIds.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        avgDurationMs: 0,
        totalCost: 0,
        activeRuns: 0,
      };
    }

    const runs = await this.runRepo.findByAgentIds(agentIds);

    const totalRuns = runs.length;
    let completedCount = 0;
    let totalDurationMs = 0;
    let durationCount = 0;
    let totalCost = 0;
    let activeRuns = 0;

    for (const run of runs) {
      const p = run.toPrimitives();

      if (p.status === RunStatus.COMPLETED) {
        completedCount++;
      }

      if (p.status === RunStatus.RUNNING) {
        activeRuns++;
      }

      if (p.durationMs !== null) {
        totalDurationMs += p.durationMs;
        durationCount++;
      }

      if (p.cost !== null) {
        totalCost += p.cost;
      }
    }

    const successRate = totalRuns > 0 ? completedCount / totalRuns : 0;
    const avgDurationMs = durationCount > 0 ? totalDurationMs / durationCount : 0;

    return {
      totalRuns,
      successRate,
      avgDurationMs,
      totalCost,
      activeRuns,
    };
  }
}
