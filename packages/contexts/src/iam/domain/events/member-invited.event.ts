import { DomainEvent } from "../../../_shared/domain/events/domain-event";
import type { MemberRole } from "../value-objects/member-role";

export class MemberInvitedEvent extends DomainEvent {
  static readonly EVENT_NAME = "iam.member.invited";

  constructor(
    readonly organizationId: string,
    readonly invitedEmail: string,
    readonly role: MemberRole,
    readonly invitedBy: string,
    readonly token: string,
  ) {
    super(MemberInvitedEvent.EVENT_NAME, organizationId);
  }
}
