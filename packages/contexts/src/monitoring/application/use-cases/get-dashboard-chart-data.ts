import type { RunRepository } from "../../ports/repositories/run-repository";
import type { AgentsContextPort } from "../../../_shared/domain/ports/agents-context-port";
import { DashboardChartData } from "../../domain/read-models/dashboard-chart-data";

const DURATION_BUCKETS = [
  { label: "<1s", max: 1000 },
  { label: "1-3s", max: 3000 },
  { label: "3-5s", max: 5000 },
  { label: "5-10s", max: 10000 },
  { label: ">10s", max: Infinity },
] as const;

export class GetDashboardChartData {
  constructor(
    private readonly runRepo: RunRepository,
    private readonly agentsPort: AgentsContextPort,
  ) {}

  async execute(params: { organizationId?: string; agentIds?: string[] }): Promise<DashboardChartData> {
    const agentIds = params.agentIds ?? await this.agentsPort.getAgentIdsForOrganization(params.organizationId!);

    if (agentIds.length === 0) {
      return DashboardChartData.empty();
    }

    const [runs, agentNames] = await Promise.all([
      this.runRepo.findByAgentIds(agentIds),
      this.agentsPort.getAgentNamesByIds(agentIds),
    ]);

    const bucketCounts = new Map<string, number>();
    const tokensByAgent = new Map<string, number>();
    const errorCounts = new Map<string, number>();

    for (const run of runs) {
      const p = run.toPrimitives();

      if (p.durationMs !== null) {
        for (const bucket of DURATION_BUCKETS) {
          if (p.durationMs < bucket.max || bucket.max === Infinity) {
            bucketCounts.set(bucket.label, (bucketCounts.get(bucket.label) ?? 0) + 1);
            break;
          }
        }
      }

      if (p.tokensUsed !== null) {
        tokensByAgent.set(p.agentId, (tokensByAgent.get(p.agentId) ?? 0) + p.tokensUsed);
      }

      if (p.error !== null) {
        errorCounts.set(p.error, (errorCounts.get(p.error) ?? 0) + 1);
      }
    }

    return DashboardChartData.create({
      durationHistogram: DURATION_BUCKETS
        .filter((b) => (bucketCounts.get(b.label) ?? 0) > 0)
        .map((b) => ({ bucket: b.label, count: bucketCounts.get(b.label)! })),
      tokensByAgent: Array.from(tokensByAgent.entries())
        .map(([agentId, tokens]) => ({ agentId, agentName: agentNames[agentId], tokens }))
        .sort((a, b) => b.tokens - a.tokens),
      errorBreakdown: Array.from(errorCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
    });
  }
}
