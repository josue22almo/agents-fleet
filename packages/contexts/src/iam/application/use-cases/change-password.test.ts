import { describe, it, expect, beforeEach } from "vitest";
import { ChangePassword } from "./change-password";
import type { AuthService, AuthTokens, AuthUser } from "../../ports/services/auth-service";
import { InvalidCredentialsError } from "../../domain/errors/invalid-credentials.error";

class StubAuthService implements AuthService {
  private users: Array<{ id: string; email: string; password: string }> = [
    { id: "user-1", email: "test@example.com", password: "old-password" },
  ];

  async signUp(email: string, password: string): Promise<AuthUser> {
    return { id: "user-1", email };
  }
  async login(email: string, password: string): Promise<AuthTokens> {
    return { accessToken: "token", refreshToken: "refresh" };
  }
  async logout(): Promise<void> {}
  async sendPasswordResetEmail(): Promise<void> {}
  async resetPassword(): Promise<void> {}
  async verifyToken(): Promise<AuthUser> {
    return { id: "user-1", email: "test@example.com" };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    if (user.password !== currentPassword) throw new InvalidCredentialsError();
    user.password = newPassword;
  }

  getPassword(userId: string): string | undefined {
    return this.users.find((u) => u.id === userId)?.password;
  }
}

describe("ChangePassword", () => {
  let useCase: ChangePassword;
  let authService: StubAuthService;

  beforeEach(() => {
    authService = new StubAuthService();
    useCase = new ChangePassword(authService);
  });

  it("changes password when current password is correct", async () => {
    await useCase.execute({
      userId: "user-1",
      currentPassword: "old-password",
      newPassword: "new-password-123",
    });

    expect(authService.getPassword("user-1")).toBe("new-password-123");
  });

  it("throws InvalidCredentialsError when current password is wrong", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        currentPassword: "wrong-password",
        newPassword: "new-password-123",
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
