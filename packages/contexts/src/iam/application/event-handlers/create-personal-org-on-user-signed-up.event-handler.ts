import { EventHandler } from "../../../_shared/domain/events/event-handler";
import { Organization } from "../../domain/entities/organization";
import { UserSignedUpEvent } from "../../domain/events/user-signed-up.event";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository";

export class CreatePersonalOrgOnUserSignedUpEventHandler extends EventHandler<UserSignedUpEvent> {
  readonly eventName = UserSignedUpEvent.EVENT_NAME;

  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly idGenerator: IdGenerator,
  ) {
    super();
  }

  async handle(event: UserSignedUpEvent): Promise<void> {
    const displayName = event.fullName ?? event.email.split("@")[0]!;

    const org = Organization.createPersonal(
      this.idGenerator.generate(),
      displayName,
      event.userId,
      this.idGenerator.generate(),
    );

    await this.orgRepo.save(org);
  }
}
