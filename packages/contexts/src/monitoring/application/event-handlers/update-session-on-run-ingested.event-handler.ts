import { EventHandler } from "../../../_shared/domain/events/event-handler";
import { RunIngestedEvent } from "../../domain/events/run-ingested.event";
import type { SessionRepository } from "../../ports/repositories/session-repository";
import type { RunRepository } from "../../ports/repositories/run-repository";

export class UpdateSessionOnRunIngestedEventHandler extends EventHandler<RunIngestedEvent> {
  readonly eventName = RunIngestedEvent.EVENT_NAME;

  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly runRepo: RunRepository,
  ) {
    super();
  }

  async handle(event: RunIngestedEvent): Promise<void> {
    const run = await this.runRepo.findById(event.runId);
    if (!run) return;

    const sessionId = run.toPrimitives().sessionId;
    if (!sessionId) return;

    const session = await this.sessionRepo.findById(sessionId);
    if (!session) return;

    session.addRun();
    await this.sessionRepo.save(session);
  }
}
