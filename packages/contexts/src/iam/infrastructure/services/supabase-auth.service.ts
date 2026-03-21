import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthService,
  AuthTokens,
  AuthUser,
} from "../../ports/services/auth-service";
import { InvalidTokenError } from "../../domain/errors/invalid-token.error";

export class SupabaseAuthService implements AuthService {
  constructor(private readonly adminClient: SupabaseClient) {}

  async signUp(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.adminClient.auth.signUp({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Signup failed: no user returned");
    return { id: data.user.id, email: data.user.email! };
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const { data, error } =
      await this.adminClient.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
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
    const { error } =
      await this.adminClient.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { error } = await this.adminClient.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  }

  async verifyToken(accessToken: string): Promise<AuthUser> {
    const { data, error } =
      await this.adminClient.auth.getUser(accessToken);
    if (error || !data.user) throw new InvalidTokenError();
    return { id: data.user.id, email: data.user.email! };
  }
}
