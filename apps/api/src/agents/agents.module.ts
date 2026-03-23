import { Module, Scope, type OnModuleInit } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseAgentRepository, UpdateAgentOnRunIngestedEventHandler, AgentsContextAdapter } from "@repo/contexts/agents";
import { SupabaseRunRepository, SupabaseSessionRepository, SupabaseToolCallRepository } from "@repo/contexts/monitoring";
import { SupabaseOrganizationRepository, IAMContextAdapter } from "@repo/contexts/iam";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { EventBus, Logger } from "@repo/contexts/_shared";
import {
  OnRunIngestedEmitActivity,
  OnRunCompletedEmitActivity,
  OnRunFailedEmitActivity,
  OnSessionStartedEmitActivity,
  OnSessionCompletedEmitActivity,
  OnSessionFailedEmitActivity,
} from "./event-handlers/activity-bridge.handlers";

import { SUPABASE_ADMIN, supabaseAdminProvider } from "../common/providers/supabase-admin.provider";
import { SupabaseRequestClient } from "../common/providers/supabase-request.provider";

import { AgentsController } from "./controllers/agents.controller";
import { EventsController } from "./controllers/events.controller";
import { IngestController } from "./controllers/ingest.controller";
import { RunsController } from "./controllers/runs.controller";

@Module({
  controllers: [AgentsController, EventsController, IngestController, RunsController],
  providers: [
    supabaseAdminProvider,
    SupabaseRequestClient,

    {
      provide: "AgentRepository",
      scope: Scope.REQUEST,
      useFactory: (supabase: SupabaseRequestClient) => new SupabaseAgentRepository(supabase.client),
      inject: [SupabaseRequestClient],
    },
    {
      provide: "AdminAgentRepository",
      useFactory: (client: SupabaseClient) => new SupabaseAgentRepository(client),
      inject: [SUPABASE_ADMIN],
    },
    {
      provide: "OrganizationRepository",
      scope: Scope.REQUEST,
      useFactory: (supabase: SupabaseRequestClient) => new SupabaseOrganizationRepository(supabase.client),
      inject: [SupabaseRequestClient],
    },
    {
      provide: "IAMContextPort",
      scope: Scope.REQUEST,
      useFactory: (supabase: SupabaseRequestClient) => new IAMContextAdapter(new SupabaseOrganizationRepository(supabase.client)),
      inject: [SupabaseRequestClient],
    },
    {
      provide: "RunRepository",
      scope: Scope.REQUEST,
      useFactory: (supabase: SupabaseRequestClient) => new SupabaseRunRepository(supabase.client),
      inject: [SupabaseRequestClient],
    },
    {
      provide: "AdminRunRepository",
      useFactory: (client: SupabaseClient) => new SupabaseRunRepository(client),
      inject: [SUPABASE_ADMIN],
    },
    {
      provide: "SessionRepository",
      scope: Scope.REQUEST,
      useFactory: (supabase: SupabaseRequestClient) => new SupabaseSessionRepository(supabase.client),
      inject: [SupabaseRequestClient],
    },
    {
      provide: "AdminSessionRepository",
      useFactory: (client: SupabaseClient) => new SupabaseSessionRepository(client),
      inject: [SUPABASE_ADMIN],
    },
    {
      provide: "ToolCallRepository",
      scope: Scope.REQUEST,
      useFactory: (supabase: SupabaseRequestClient) => new SupabaseToolCallRepository(supabase.client),
      inject: [SupabaseRequestClient],
    },
    {
      provide: "AdminToolCallRepository",
      useFactory: (client: SupabaseClient) => new SupabaseToolCallRepository(client),
      inject: [SUPABASE_ADMIN],
    },
    {
      provide: "AgentsContextPort",
      scope: Scope.REQUEST,
      useFactory: (supabase: SupabaseRequestClient) => new AgentsContextAdapter(new SupabaseAgentRepository(supabase.client)),
      inject: [SupabaseRequestClient],
    },
    {
      provide: "IdGenerator",
      useValue: { generate: () => randomUUID() },
    },
  ],
})
export class AgentsModule implements OnModuleInit {
  constructor(
    @Inject("EventBus") private readonly eventBus: EventBus,
    @Inject("AdminAgentRepository") private readonly adminAgentRepo: SupabaseAgentRepository,
    @Inject("Logger") private readonly logger: Logger,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.eventBus.register(
      new UpdateAgentOnRunIngestedEventHandler(this.adminAgentRepo, this.logger),
    );

    // Bridge domain events to SSE activity feed
    this.eventBus.register(new OnRunIngestedEmitActivity(this.eventEmitter));
    this.eventBus.register(new OnRunCompletedEmitActivity(this.eventEmitter));
    this.eventBus.register(new OnRunFailedEmitActivity(this.eventEmitter));
    this.eventBus.register(new OnSessionStartedEmitActivity(this.eventEmitter));
    this.eventBus.register(new OnSessionCompletedEmitActivity(this.eventEmitter));
    this.eventBus.register(new OnSessionFailedEmitActivity(this.eventEmitter));
  }
}
