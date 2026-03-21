import type { EventBus } from "../../../_shared/domain/events/event-bus";
import type { Logger } from "../../../_shared/domain/ports/logger";
import { UserSignedUpEvent } from "../../domain/events/user-signed-up.event";
import type { AuthService } from "../../ports/services/auth-service";

interface SignUpParams {
  email: string;
  password: string;
  fullName: string | null;
}

export class SignUp {
  constructor(
    private readonly authService: AuthService,
    private readonly eventBus: EventBus,
    private readonly logger: Logger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  ) {}

  async execute(params: SignUpParams): Promise<void> {
    const authUser = await this.authService.signUp(params.email, params.password);

    await this.eventBus.publish([
      new UserSignedUpEvent(authUser.id, params.email, params.fullName),
    ]);

    this.logger.info("User signed up", { userId: authUser.id, email: params.email });
  }
}
