export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthService {
  signUp(email: string, password: string): Promise<AuthUser>;
  login(email: string, password: string): Promise<AuthTokens>;
  logout(accessToken: string): Promise<void>;
  sendPasswordResetEmail(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  verifyToken(accessToken: string): Promise<AuthUser>;
}
