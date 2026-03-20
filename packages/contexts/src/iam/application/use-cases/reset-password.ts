import type { AuthService } from "../../ports/services/auth-service.js";

export class ResetPassword {
  constructor(private readonly authService: AuthService) {}

  async execute(token: string, newPassword: string): Promise<void> {
    await this.authService.resetPassword(token, newPassword);
  }
}
