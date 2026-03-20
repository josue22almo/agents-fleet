import { Module, Scope } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import {
  SupabaseAuthService,
  SupabaseUserRepository,
  SupabaseOrganizationRepository,
  SupabaseInvitationRepository,
} from "@repo/contexts/iam";
import { InMemoryEventBus } from "@repo/contexts/_shared";

import { SUPABASE_ADMIN, supabaseAdminProvider } from "../common/providers/supabase-admin.provider";
import { SupabaseRequestClient } from "../common/providers/supabase-request.provider";

import { AuthController } from "./controllers/auth.controller";
import { OrganizationsController } from "./controllers/organizations.controller";
import { MembersController } from "./controllers/members.controller";
import { InvitationsController } from "./controllers/invitations.controller";

@Module({
  controllers: [AuthController, OrganizationsController, MembersController, InvitationsController],
  providers: [
    supabaseAdminProvider,
    SupabaseRequestClient,

    {
      provide: "AuthService",
      useFactory: (client: SupabaseClient) => new SupabaseAuthService(client),
      inject: [SUPABASE_ADMIN],
    },
    {
      provide: "UserRepository",
      scope: Scope.REQUEST,
      useFactory: (supabase: SupabaseRequestClient) => new SupabaseUserRepository(supabase.client),
      inject: [SupabaseRequestClient],
    },
    {
      provide: "OrganizationRepository",
      scope: Scope.REQUEST,
      useFactory: (supabase: SupabaseRequestClient) => new SupabaseOrganizationRepository(supabase.client),
      inject: [SupabaseRequestClient],
    },
    {
      provide: "InvitationRepository",
      scope: Scope.REQUEST,
      useFactory: (supabase: SupabaseRequestClient) => new SupabaseInvitationRepository(supabase.client),
      inject: [SupabaseRequestClient],
    },
    {
      provide: "EventBus",
      useFactory: () => new InMemoryEventBus(),
    },
    {
      provide: "IdGenerator",
      useValue: { generate: () => randomUUID() },
    },
    {
      provide: "TokenGenerator",
      useValue: { generate: () => randomUUID() },
    },
    {
      provide: "EmailService",
      useValue: { sendInvitation: async () => {} },
    },
  ],
  exports: ["AuthService"],
})
export class IamModule {}
