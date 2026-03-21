import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthService, AuthTokens, AuthUser } from "../../ports/services/auth-service";
import { InvalidCredentialsError } from "../../domain/errors/invalid-credentials.error";
import { InvalidTokenError } from "../../domain/errors/invalid-token.error";

export class SupabaseAuthService implements AuthService {
  constructor(private readonly adminClient: SupabaseClient) {}

  private mustRun(): boolean {
    if (process.env.NODE_ENV === "e2e") {
      return false;
    }
    return true;
  }

  async signUp(email: string, password: string): Promise<AuthUser> {
    if (!this.mustRun()) {
      // E2E mode: create user via admin API (no email sent, auto-confirmed)
      const { data, error } = await this.adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
      return { id: data.user.id, email: data.user.email! };
    }
    const { data, error } = await this.adminClient.auth.signUp({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Signup failed: no user returned");
    return { id: data.user.id, email: data.user.email! };
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const { data, error } = await this.adminClient.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message === "Invalid login credentials") {
        throw new InvalidCredentialsError();
      }
      throw new Error(error.message);
    }
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async logout(accessToken: string): Promise<void> {
    const { error } = await this.adminClient.auth.admin.signOut(accessToken);
    if (error) throw new Error(error.message);
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    if (!this.mustRun()) {
      return;
    }
    const { error } = await this.adminClient.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!this.mustRun()) {
      return;
    }
    const { error } = await this.adminClient.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  }

  async verifyToken(accessToken: string): Promise<AuthUser> {
    const { data, error } = await this.adminClient.auth.getUser(accessToken);
    if (error || !data.user) throw new InvalidTokenError();
    return { id: data.user.id, email: data.user.email! };
  }
}
