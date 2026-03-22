import { Module } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseAgentRepository } from "@repo/contexts/agents";
import { SupabaseRunRepository, SupabaseSessionRepository } from "@repo/contexts/monitoring";

import { SUPABASE_ADMIN, supabaseAdminProvider } from "../common/providers/supabase-admin.provider";
import { McpController } from "./mcp.controller";

@Module({
  controllers: [McpController],
  providers: [
    supabaseAdminProvider,
    {
      provide: "AdminAgentRepository",
      useFactory: (client: SupabaseClient) => new SupabaseAgentRepository(client),
      inject: [SUPABASE_ADMIN],
    },
    {
      provide: "AdminRunRepository",
      useFactory: (client: SupabaseClient) => new SupabaseRunRepository(client),
      inject: [SUPABASE_ADMIN],
    },
    {
      provide: "AdminSessionRepository",
      useFactory: (client: SupabaseClient) => new SupabaseSessionRepository(client),
      inject: [SUPABASE_ADMIN],
    },
    {
      provide: "IdGenerator",
      useValue: { generate: () => randomUUID() },
    },
  ],
})
export class McpModule {}
