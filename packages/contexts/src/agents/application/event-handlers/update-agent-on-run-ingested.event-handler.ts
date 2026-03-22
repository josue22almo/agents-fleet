import { EventHandler } from "../../../_shared/domain/events/event-handler";
import type { Logger } from "../../../_shared/domain/ports/logger";
import { RunIngestedEvent } from "../../../monitoring";
import type { AgentRepository } from "../../ports/repositories/agent-repository";

export class UpdateAgentOnRunIngestedEventHandler extends EventHandler<RunIngestedEvent> {
  readonly eventName = "monitoring.run.ingested";

  constructor(
    private readonly agentRepo: AgentRepository,
    private readonly logger: Logger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  ) {
    super();
  }

  async handle(event: RunIngestedEvent): Promise<void> {
    try {
      const agent = await this.agentRepo.findById(event.agentId);
      if (!agent) return;

      agent.updateLastSeen();
      agent.markActive();
      await this.agentRepo.save(agent);
      this.logger.info("Agent status updated on run ingested", { agentId: event.agentId });
    } catch (error) {
      this.logger.error("Failed to update agent on run ingested", { agentId: event.agentId, error: String(error) });
    }
  }
}
