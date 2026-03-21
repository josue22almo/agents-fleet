import { DomainEvent } from "../../../_shared/domain/events/domain-event";

export class InvitationAcceptedEvent extends DomainEvent {
  static readonly EVENT_NAME = "iam.invitation.accepted";

  constructor(
    readonly organizationId: string,
    readonly userId: string,
    readonly token: string,
  ) {
    super(InvitationAcceptedEvent.EVENT_NAME, organizationId);
  }
}
