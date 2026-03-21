import { EventHandler } from "../../../_shared/domain/events/event-handler";
import type { Logger } from "../../../_shared/domain/ports/logger";
import { User } from "../../domain/entities/user";
import { Email } from "../../domain/value-objects/email";
import { UserSignedUpEvent } from "../../domain/events/user-signed-up.event";
import type { UserRepository } from "../../ports/repositories/user-repository";

export class CreateProfileOnUserSignedUpEventHandler extends EventHandler<UserSignedUpEvent> {
  readonly eventName = UserSignedUpEvent.EVENT_NAME;

  constructor(
    private readonly userRepo: UserRepository,
    private readonly logger: Logger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  ) {
    super();
  }

  async handle(event: UserSignedUpEvent): Promise<void> {
    try {
      const user = User.create({
        id: event.userId,
        email: new Email(event.email),
        fullName: event.fullName,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.userRepo.save(user);
      this.logger.info("Profile created for user", { userId: event.userId, email: event.email });
    } catch (error) {
      this.logger.error("Failed to create profile for user", { userId: event.userId, email: event.email, error: String(error) });
      throw error;
    }
  }
}
