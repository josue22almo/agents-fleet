import { Module } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { InMemoryEventBus } from "@repo/contexts/_shared";
import {
  InMemoryUserRepository,
  InMemoryOrganizationRepository,
  InMemoryInvitationRepository,
  CreateProfileOnUserSignedUpEventHandler,
  CreatePersonalOrgOnUserSignedUpEventHandler,
  type AuthService,
  type AuthTokens,
  type AuthUser,
} from "@repo/contexts/iam";

import { AuthController } from "./iam/controllers/auth.controller";
import { OrganizationsController } from "./iam/controllers/organizations.controller";
import { MembersController } from "./iam/controllers/members.controller";
import { InvitationsController } from "./iam/controllers/invitations.controller";

let idCounter = 0;

function createMockAuthService(): AuthService {
  const users = new Map<string, { id: string; email: string; password: string }>();

  return {
    signUp: async (email: string, _password: string): Promise<AuthUser> => {
      const id = randomUUID();
      users.set(email, { id, email, password: _password });
      return { id, email };
    },
    login: async (email: string, password: string): Promise<AuthTokens> => {
      const user = users.get(email);
      if (!user || user.password !== password) {
        throw new Error("Invalid credentials");
      }
      return { accessToken: `token-${user.id}`, refreshToken: `refresh-${user.id}` };
    },
    logout: async () => {},
    sendPasswordResetEmail: async () => {},
    resetPassword: async () => {},
    verifyToken: async (token: string): Promise<AuthUser> => {
      const userId = token.replace("token-", "");
      for (const user of users.values()) {
        if (user.id === userId) return { id: user.id, email: user.email };
      }
      throw new Error("Invalid token");
    },
  };
}

@Module({
  controllers: [AuthController, OrganizationsController, MembersController, InvitationsController],
  providers: [
    {
      provide: "AuthService",
      useFactory: () => createMockAuthService(),
    },
    {
      provide: "UserRepository",
      useFactory: () => new InMemoryUserRepository(),
    },
    {
      provide: "OrganizationRepository",
      useFactory: () => new InMemoryOrganizationRepository(),
    },
    {
      provide: "InvitationRepository",
      useFactory: () => new InMemoryInvitationRepository(),
    },
    {
      provide: "EventBus",
      useFactory: (
        userRepo: InMemoryUserRepository,
        orgRepo: InMemoryOrganizationRepository,
      ) => {
        const eventBus = new InMemoryEventBus();
        eventBus.register(new CreateProfileOnUserSignedUpEventHandler(userRepo));
        eventBus.register(
          new CreatePersonalOrgOnUserSignedUpEventHandler(orgRepo, {
            generate: () => `id-${++idCounter}`,
          }),
        );
        return eventBus;
      },
      inject: ["UserRepository", "OrganizationRepository"],
    },
    {
      provide: "IdGenerator",
      useValue: { generate: () => `id-${++idCounter}` },
    },
    {
      provide: "TokenGenerator",
      useValue: { generate: () => `tok-${++idCounter}` },
    },
    {
      provide: "EmailService",
      useValue: { send: async () => {} },
    },
  ],
  exports: ["AuthService"],
})
export class TestIamModule {}
