import type { Run } from "../../domain/entities/run";

export interface RunRepository {
  findById(id: string): Promise<Run | null>;
  findByAgentIdAndExternalRunId(agentId: string, externalRunId: string): Promise<Run | null>;
  findByAgentId(agentId: string, options?: { limit: number; offset: number }): Promise<Run[]>;
  countByAgentId(agentId: string): Promise<number>;
  findByAgentIds(agentIds: string[]): Promise<Run[]>;
  save(run: Run): Promise<void>;
}
