import { ConsoleLogger, Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAuthService } from "@repo/contexts/iam";
import { NestJsEventBusAdapter } from "./providers/nestjs-event-bus.adapter";
import { NestJsLoggerAdapter } from "./providers/nestjs-logger.adapter";
import { SUPABASE_ADMIN, supabaseAdminProvider } from "./providers/supabase-admin.provider";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Global()
@Module({
  providers: [
    supabaseAdminProvider,
    {
      provide: "AuthService",
      useFactory: (client: SupabaseClient) => new SupabaseAuthService(client),
      inject: [SUPABASE_ADMIN],
    },
    JwtAuthGuard,
    NestJsEventBusAdapter,
    {
      provide: "EventBus",
      useExisting: NestJsEventBusAdapter,
    },
    NestJsLoggerAdapter,
    {
      provide: "Logger",
      useExisting: NestJsLoggerAdapter,
    },
    {
      provide: "APP_LOGGER",
      useClass: ConsoleLogger,
    },
  ],
  exports: ["AuthService", JwtAuthGuard, "EventBus", "Logger", "APP_LOGGER"],
})
export class SharedModule {}
