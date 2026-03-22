import { InMemoryEventBus } from "../../../_shared/application/in-memory-event-bus";
import { InMemoryUserRepository } from "../../infrastructure/persistence/in-memory-user-repository";
import { InMemoryOrganizationRepository } from "../../infrastructure/persistence/in-memory-organization-repository";
import { InMemoryInvitationRepository } from "../../infrastructure/persistence/in-memory-invitation-repository";
import type { AuthService, AuthTokens, AuthUser } from "../../ports/services/auth-service";
import type { EmailService } from "../../../_shared/domain/models/email-service";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { TokenGenerator } from "../../ports/services/token-generator";

export function createTestDeps() {
  let idCounter = 0;
  let tokenCounter = 0;

  const userRepo = new InMemoryUserRepository();
  const orgRepo = new InMemoryOrganizationRepository();
  const invitationRepo = new InMemoryInvitationRepository();
  const eventBus = new InMemoryEventBus();

  const idGenerator: IdGenerator = {
    generate: () => `id-${++idCounter}`,
  };

  const tokenGenerator: TokenGenerator = {
    generate: () => `token-${++tokenCounter}`,
  };

  const authService: AuthService = {
    signUp: async (email: string, _password: string): Promise<AuthUser> => ({
      id: idGenerator.generate(),
      email,
    }),
    login: async (_email: string, _password: string): Promise<AuthTokens> => ({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    }),
    logout: async () => {},
    sendPasswordResetEmail: async () => {},
    resetPassword: async () => {},
    changePassword: async () => {},
    verifyToken: async (token: string): Promise<AuthUser> => ({
      id: "user-1",
      email: "test@example.com",
    }),
  };

  const emailService: EmailService = {
    send: async () => {},
  };

  return {
    userRepo,
    orgRepo,
    invitationRepo,
    eventBus,
    idGenerator,
    tokenGenerator,
    authService,
    emailService,
  };
}
