import type { Logger } from "../../../_shared/domain/ports/logger";
import type { AuthService, AuthTokens } from "../../ports/services/auth-service";

interface LoginParams {
  email: string;
  password: string;
}

export class Login {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: Logger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  ) {}

  async execute(params: LoginParams): Promise<AuthTokens> {
    try {
      return await this.authService.login(params.email, params.password);
    } catch (error) {
      this.logger.warn("Login failed", { email: params.email, error: String(error) });
      throw error;
    }
  }
}
