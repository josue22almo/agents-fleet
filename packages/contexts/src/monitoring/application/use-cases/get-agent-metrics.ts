import { AgentMetrics } from "../../domain/read-models/agent-metrics";
import { RunStatus } from "../../domain/value-objects/run-status";
import type { RunRepository } from "../../ports/repositories/run-repository";

export class GetAgentMetrics {
  constructor(private readonly runRepo: RunRepository) {}

  async execute(agentId: string): Promise<AgentMetrics> {
    const runs = await this.runRepo.findByAgentId(agentId);

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

    return AgentMetrics.create({
      agentId,
      totalRuns,
      successRate,
      avgDurationMs,
      totalCost,
      activeRuns,
    });
  }
}
