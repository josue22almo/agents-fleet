import { RunStatus } from "../../domain/value-objects/run-status";
import type { RunRepository } from "../../ports/repositories/run-repository";
import { AgentUsageStats } from "../../domain/read-models/agent-usage-stats";

export class GetAgentUsageStats {
  constructor(private readonly runRepo: RunRepository) {}

  async execute(params: { agentId: string }): Promise<AgentUsageStats> {
    const runs = await this.runRepo.findByAgentId(params.agentId, {
      limit: 10000,
      offset: 0,
    });

    const now = new Date();
    const currentPeriodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const periodMap = new Map<
      string,
      { runs: number; tokens: number; cost: number; completed: number }
    >();

    for (const run of runs) {
      const p = run.toPrimitives();
      const date = p.startedAt;
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!periodMap.has(period)) {
        periodMap.set(period, { runs: 0, tokens: 0, cost: 0, completed: 0 });
      }

      const entry = periodMap.get(period)!;
      entry.runs++;

      if (p.tokensUsed !== null) entry.tokens += p.tokensUsed;
      if (p.cost !== null) entry.cost += p.cost;
      if (p.status === RunStatus.COMPLETED) entry.completed++;
    }

    const toPeriodStats = (period: string) => {
      const data = periodMap.get(period);
      if (!data) return { period, runs: 0, tokens: 0, cost: 0, successRate: 0 };
      return {
        period,
        runs: data.runs,
        tokens: data.tokens,
        cost: data.cost,
        successRate: data.runs > 0 ? (data.completed / data.runs) * 100 : 0,
      };
    };

    const currentPeriod = toPeriodStats(currentPeriodKey);
    const history = Array.from(periodMap.keys())
      .filter((p) => p !== currentPeriodKey)
      .sort((a, b) => b.localeCompare(a))
      .map(toPeriodStats);

    return AgentUsageStats.create({ currentPeriod, history });
  }
}
