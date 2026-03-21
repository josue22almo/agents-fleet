import type { AuthService, AuthUser } from "../../ports/services/auth-service";

export class VerifyToken {
  constructor(private readonly authService: AuthService) {}

  async execute(accessToken: string): Promise<AuthUser> {
    return this.authService.verifyToken(accessToken);
  }
}
