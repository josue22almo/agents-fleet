import { Module, Scope, type OnModuleInit } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

import {
  SupabaseAuthService,
  SupabaseUserRepository,
  SupabaseOrganizationRepository,
  SupabaseInvitationRepository,
  CreateProfileOnUserSignedUpEventHandler,
  CreatePersonalOrgOnUserSignedUpEventHandler,
} from "@repo/contexts/iam";
import type { EventBus } from "@repo/contexts/_shared";
import { SmtpEmailService } from "@repo/contexts/_shared";

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
      provide: "AdminUserRepository",
      useFactory: (client: SupabaseClient) => new SupabaseUserRepository(client),
      inject: [SUPABASE_ADMIN],
    },
    {
      provide: "AdminOrganizationRepository",
      useFactory: (client: SupabaseClient) => new SupabaseOrganizationRepository(client),
      inject: [SUPABASE_ADMIN],
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
      useFactory: (config: ConfigService) =>
        new SmtpEmailService({
          host: config.get("SMTP_HOST", "mail.smtp2go.com"),
          port: config.get("SMTP_PORT", 587),
          username: config.get("SMTP_USERNAME", ""),
          password: config.get("SMTP_PASSWORD", ""),
          from: config.get("SMTP_FROM", "noreply@multasapp.com"),
        }),
      inject: [ConfigService],
    },
  ],
  exports: ["AuthService"],
})
export class IamModule implements OnModuleInit {
  constructor(
    @Inject("EventBus") private readonly eventBus: EventBus,
    @Inject("AdminUserRepository") private readonly userRepo: SupabaseUserRepository,
    @Inject("AdminOrganizationRepository") private readonly orgRepo: SupabaseOrganizationRepository,
  ) {}

  onModuleInit() {
    this.eventBus.register(
      new CreateProfileOnUserSignedUpEventHandler(this.userRepo),
    );
    this.eventBus.register(
      new CreatePersonalOrgOnUserSignedUpEventHandler(
        this.orgRepo,
        { generate: () => randomUUID() },
      ),
    );
  }
}
