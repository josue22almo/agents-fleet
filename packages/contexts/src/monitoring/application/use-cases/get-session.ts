import type { Session } from "../../domain/entities/session";
import type { Run } from "../../domain/entities/run";
import { SessionNotFoundError } from "../../domain/errors/session-not-found.error";
import type { SessionRepository } from "../../ports/repositories/session-repository";
import type { RunRepository } from "../../ports/repositories/run-repository";

interface GetSessionResult {
  session: Session;
  runs: Run[];
}

export class GetSession {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly runRepo: RunRepository,
  ) {}

  async execute(sessionId: string): Promise<GetSessionResult> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    const runs = await this.runRepo.findBySessionId(sessionId);

    return { session, runs };
  }
}
