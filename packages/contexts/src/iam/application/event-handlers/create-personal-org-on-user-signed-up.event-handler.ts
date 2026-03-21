import { EventHandler } from "../../../_shared/domain/events/event-handler";
import type { Logger } from "../../../_shared/domain/ports/logger";
import { Organization } from "../../domain/entities/organization";
import { UserSignedUpEvent } from "../../domain/events/user-signed-up.event";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository";

export class CreatePersonalOrgOnUserSignedUpEventHandler extends EventHandler<UserSignedUpEvent> {
  readonly eventName = UserSignedUpEvent.EVENT_NAME;

  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly idGenerator: IdGenerator,
    private readonly logger: Logger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  ) {
    super();
  }

  async handle(event: UserSignedUpEvent): Promise<void> {
    try {
      const displayName = event.fullName ?? event.email.split("@")[0]!;

      const org = Organization.createPersonal(
        this.idGenerator.generate(),
        displayName,
        event.userId,
        this.idGenerator.generate(),
      );

      await this.orgRepo.save(org);
      this.logger.info("Personal organization created for user", { userId: event.userId });
    } catch (error) {
      this.logger.error("Failed to create personal organization for user", { userId: event.userId, error: String(error) });
      throw error;
    }
  }
}
