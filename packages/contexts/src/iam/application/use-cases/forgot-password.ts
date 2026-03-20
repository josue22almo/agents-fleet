import type { AuthService } from "../../ports/services/auth-service.js";

export class ForgotPassword {
  constructor(private readonly authService: AuthService) {}

  async execute(email: string): Promise<void> {
    await this.authService.sendPasswordResetEmail(email);
  }
}
