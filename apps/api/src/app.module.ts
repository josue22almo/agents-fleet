import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { AppController } from "./app.controller";
import { SharedModule } from "./common/shared.module";
import { IamModule } from "./iam/iam.module";
import { AgentsModule } from "./agents/agents.module";
import { McpModule } from "./mcp/mcp.module";
import { CatchAllFilter } from "./common/filters/catch-all.filter";
import { DomainErrorFilter } from "./common/filters/domain-error.filter";
import { ZodErrorFilter } from "./common/filters/zod-error.filter";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    SharedModule,
    IamModule,
    AgentsModule,
    McpModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: CatchAllFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ZodErrorFilter,
    },
  ],
})
export class AppModule {}
