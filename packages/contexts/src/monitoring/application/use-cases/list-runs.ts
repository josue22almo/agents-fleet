import type { Run } from "../../domain/entities/run";
import type { RunRepository } from "../../ports/repositories/run-repository";

interface ListRunsParams {
  agentId: string;
  page?: number;
  pageSize?: number;
}

interface ListRunsResult {
  runs: Run[];
  total: number;
  page: number;
  pageSize: number;
}

export class ListRuns {
  constructor(private readonly runRepo: RunRepository) {}

  async execute(params: ListRunsParams): Promise<ListRunsResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const [runs, total] = await Promise.all([
      this.runRepo.findByAgentId(params.agentId, { limit: pageSize, offset }),
      this.runRepo.countByAgentId(params.agentId),
    ]);

    return { runs, total, page, pageSize };
  }
}
