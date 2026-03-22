import type { Run } from "../../domain/entities/run";
import type { RunRepository } from "../../ports/repositories/run-repository";

export class InMemoryRunRepository implements RunRepository {
  private runs: Map<string, Run> = new Map();

  async findById(id: string): Promise<Run | null> {
    return this.runs.get(id) ?? null;
  }

  async findByAgentIdAndExternalRunId(
    agentId: string,
    externalRunId: string,
  ): Promise<Run | null> {
    for (const run of this.runs.values()) {
      const p = run.toPrimitives();
      if (p.agentId === agentId && p.externalRunId === externalRunId) {
        return run;
      }
    }
    return null;
  }

  async findByAgentId(
    agentId: string,
    options?: { limit: number; offset: number },
  ): Promise<Run[]> {
    const matching = Array.from(this.runs.values())
      .filter((r) => r.toPrimitives().agentId === agentId)
      .sort(
        (a, b) =>
          b.toPrimitives().startedAt.getTime() -
          a.toPrimitives().startedAt.getTime(),
      );

    if (options) {
      return matching.slice(options.offset, options.offset + options.limit);
    }
    return matching;
  }

  async countByAgentId(agentId: string): Promise<number> {
    let count = 0;
    for (const run of this.runs.values()) {
      if (run.toPrimitives().agentId === agentId) count++;
    }
    return count;
  }

  async findByAgentIds(agentIds: string[]): Promise<Run[]> {
    const idSet = new Set(agentIds);
    return Array.from(this.runs.values()).filter((r) =>
      idSet.has(r.toPrimitives().agentId),
    );
  }

  async save(run: Run): Promise<void> {
    this.runs.set(run.id, run);
  }
}
