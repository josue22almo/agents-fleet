import type { AuthService, AuthTokens } from "../../ports/services/auth-service.js";

interface LoginParams {
  email: string;
  password: string;
}

export class Login {
  constructor(private readonly authService: AuthService) {}

  async execute(params: LoginParams): Promise<AuthTokens> {
    return this.authService.login(params.email, params.password);
  }
}
