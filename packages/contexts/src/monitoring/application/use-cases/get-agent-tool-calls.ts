import type { ToolCallRepository } from "../../ports/repositories/tool-call-repository";

export interface ToolCallSummary {
  toolName: string;
  calls: number;
  avgDurationMs: number;
  successRate: number;
}

export class GetAgentToolCalls {
  constructor(private readonly toolCallRepo: ToolCallRepository) {}

  async execute(params: { agentId: string }): Promise<ToolCallSummary[]> {
    const calls = await this.toolCallRepo.findByAgentId(params.agentId);

    const grouped = new Map<
      string,
      { count: number; totalDuration: number; successCount: number }
    >();

    for (const call of calls) {
      const p = call.toPrimitives();
      const existing = grouped.get(p.toolName) ?? {
        count: 0,
        totalDuration: 0,
        successCount: 0,
      };

      existing.count += 1;
      existing.totalDuration += p.durationMs ?? 0;
      if (p.success) existing.successCount += 1;

      grouped.set(p.toolName, existing);
    }

    return Array.from(grouped.entries()).map(([toolName, stats]) => ({
      toolName,
      calls: stats.count,
      avgDurationMs:
        stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
      successRate:
        stats.count > 0 ? stats.successCount / stats.count : 0,
    }));
  }
}
