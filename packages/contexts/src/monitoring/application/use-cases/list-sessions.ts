import type { Session } from "../../domain/entities/session";
import type { SessionRepository } from "../../ports/repositories/session-repository";

interface ListSessionsParams {
  agentId: string;
  page?: number;
  pageSize?: number;
}

interface ListSessionsResult {
  sessions: Session[];
  total: number;
  page: number;
  pageSize: number;
}

export class ListSessions {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(params: ListSessionsParams): Promise<ListSessionsResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const [sessions, total] = await Promise.all([
      this.sessionRepo.findByAgentId(params.agentId, { limit: pageSize, offset }),
      this.sessionRepo.countByAgentId(params.agentId),
    ]);

    return { sessions, total, page, pageSize };
  }
}
