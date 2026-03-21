import { DomainEvent } from "../../../_shared/domain/events/domain-event";

export class UserSignedUpEvent extends DomainEvent {
  static readonly EVENT_NAME = "iam.user.signed_up";

  constructor(
    readonly userId: string,
    readonly email: string,
  ) {
    super(UserSignedUpEvent.EVENT_NAME, userId);
  }
}
