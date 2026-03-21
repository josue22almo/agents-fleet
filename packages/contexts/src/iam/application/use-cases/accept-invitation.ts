import type { EventBus } from "../../../_shared/domain/events/event-bus";
import { InvitationAcceptedEvent } from "../../domain/events/invitation-accepted.event";
import { InvalidTokenError } from "../../domain/errors/invalid-token.error";
import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { InvitationRepository } from "../../ports/repositories/invitation-repository";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository";

interface AcceptInvitationParams {
  token: string;
  userId: string;
}

export class AcceptInvitation {
  constructor(
    private readonly invitationRepo: InvitationRepository,
    private readonly orgRepo: OrganizationRepository,
    private readonly idGenerator: IdGenerator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(params: AcceptInvitationParams): Promise<void> {
    const invitation = await this.invitationRepo.findByToken(params.token);
    if (!invitation) throw new InvalidTokenError();

    invitation.accept();

    const primitives = invitation.toPrimitives();
    const org = await this.orgRepo.findById(primitives.organizationId);
    if (!org) throw new OrganizationNotFoundError(primitives.organizationId);

    const role = primitives.role as import("../../domain/value-objects/member-role.js").MemberRole;
    org.addMember(this.idGenerator.generate(), params.userId, role);

    await this.invitationRepo.save(invitation);
    await this.orgRepo.save(org);

    await this.eventBus.publish([
      new InvitationAcceptedEvent(
        primitives.organizationId,
        params.userId,
        params.token,
      ),
    ]);
  }
}
