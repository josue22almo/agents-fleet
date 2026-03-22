import type { AuthService } from "../../ports/services/auth-service";

interface ChangePasswordParams {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePassword {
  constructor(private readonly authService: AuthService) {}

  async execute(params: ChangePasswordParams): Promise<void> {
    await this.authService.changePassword(
      params.userId,
      params.currentPassword,
      params.newPassword,
    );
  }
}
