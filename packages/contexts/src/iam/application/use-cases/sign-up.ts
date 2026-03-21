import type { EventBus } from "../../../_shared/domain/events/event-bus";
import { UserSignedUpEvent } from "../../domain/events/user-signed-up.event";
import type { AuthService, AuthTokens } from "../../ports/services/auth-service";

interface SignUpParams {
  email: string;
  password: string;
  fullName: string | null;
}

export class SignUp {
  constructor(
    private readonly authService: AuthService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(params: SignUpParams): Promise<AuthTokens> {
    const authUser = await this.authService.signUp(params.email, params.password);

    await this.eventBus.publish([
      new UserSignedUpEvent(authUser.id, params.email, params.fullName),
    ]);

    return this.authService.login(params.email, params.password);
  }
}
