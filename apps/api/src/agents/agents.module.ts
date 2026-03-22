import { Module, Scope } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseAgentRepository } from "@repo/contexts/agents";
import { SupabaseRunRepository } from "@repo/contexts/monitoring";
import { SupabaseOrganizationRepository } from "@repo/contexts/iam";

import { SUPABASE_ADMIN, supabaseAdminProvider } from "../common/providers/supabase-admin.provider";
import { SupabaseRequestClient } from "../common/providers/supabase-request.provider";

import { AgentsController } from "./controllers/agents.controller";
import { IngestController } from "./controllers/ingest.controller";
import { RunsController } from "./controllers/runs.controller";

@Module({
  controllers: [AgentsController, IngestController, RunsController],
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
      provide: "IdGenerator",
      useValue: { generate: () => randomUUID() },
    },
  ],
})
export class AgentsModule {}
