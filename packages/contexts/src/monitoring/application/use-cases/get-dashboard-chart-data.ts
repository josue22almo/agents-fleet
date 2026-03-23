import type { RunRepository } from "../../ports/repositories/run-repository";

interface DurationBucket {
  bucket: string;
  count: number;
}

interface TokensByAgent {
  agentId: string;
  tokens: number;
}

interface ErrorBreakdown {
  type: string;
  count: number;
}

interface DashboardChartData {
  durationHistogram: DurationBucket[];
  tokensByAgent: TokensByAgent[];
  errorBreakdown: ErrorBreakdown[];
}

const DURATION_BUCKETS = [
  { label: "<1s", max: 1000 },
  { label: "1-3s", max: 3000 },
  { label: "3-5s", max: 5000 },
  { label: "5-10s", max: 10000 },
  { label: ">10s", max: Infinity },
] as const;

export class GetDashboardChartData {
  constructor(private readonly runRepo: RunRepository) {}

  async execute(params: { agentIds: string[] }): Promise<DashboardChartData> {
    if (params.agentIds.length === 0) {
      return { durationHistogram: [], tokensByAgent: [], errorBreakdown: [] };
    }

    const runs = await this.runRepo.findByAgentIds(params.agentIds);

    const bucketCounts = new Map<string, number>();
    const tokensByAgent = new Map<string, number>();
    const errorCounts = new Map<string, number>();

    for (const run of runs) {
      const p = run.toPrimitives();

      // Duration histogram
      if (p.durationMs !== null) {
        for (const bucket of DURATION_BUCKETS) {
          if (p.durationMs < bucket.max || bucket.max === Infinity) {
            bucketCounts.set(
              bucket.label,
              (bucketCounts.get(bucket.label) ?? 0) + 1,
            );
            break;
          }
        }
      }

      // Tokens by agent
      if (p.tokensUsed !== null) {
        tokensByAgent.set(
          p.agentId,
          (tokensByAgent.get(p.agentId) ?? 0) + p.tokensUsed,
        );
      }

      // Error breakdown
      if (p.error !== null) {
        errorCounts.set(p.error, (errorCounts.get(p.error) ?? 0) + 1);
      }
    }

    // Build histogram preserving bucket order, excluding zero counts
    const durationHistogram: DurationBucket[] = DURATION_BUCKETS.filter(
      (b) => (bucketCounts.get(b.label) ?? 0) > 0,
    ).map((b) => ({ bucket: b.label, count: bucketCounts.get(b.label)! }));

    // Sort tokens by agent desc
    const tokensByAgentResult: TokensByAgent[] = Array.from(
      tokensByAgent.entries(),
    )
      .map(([agentId, tokens]) => ({ agentId, tokens }))
      .sort((a, b) => b.tokens - a.tokens);

    // Sort errors by count desc
    const errorBreakdown: ErrorBreakdown[] = Array.from(
      errorCounts.entries(),
    )
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      durationHistogram,
      tokensByAgent: tokensByAgentResult,
      errorBreakdown,
    };
  }
}
