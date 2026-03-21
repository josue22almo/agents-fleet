import { EventHandler } from "../../../_shared/domain/events/event-handler";
import { User } from "../../domain/entities/user";
import { Email } from "../../domain/value-objects/email";
import { UserSignedUpEvent } from "../../domain/events/user-signed-up.event";
import type { UserRepository } from "../../ports/repositories/user-repository";

export class CreateProfileOnUserSignedUpEventHandler extends EventHandler<UserSignedUpEvent> {
  readonly eventName = UserSignedUpEvent.EVENT_NAME;

  constructor(private readonly userRepo: UserRepository) {
    super();
  }

  async handle(event: UserSignedUpEvent): Promise<void> {
    const user = User.create({
      id: event.userId,
      email: new Email(event.email),
      fullName: event.fullName,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.userRepo.save(user);
  }
}
