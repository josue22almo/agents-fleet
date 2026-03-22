import { ConsoleLogger, Global, Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { AppController } from "./app.controller";
import { IamModule } from "./iam/iam.module";
import { AgentsModule } from "./agents/agents.module";
import { NestJsEventBusAdapter } from "./common/providers/nestjs-event-bus.adapter";
import { NestJsLoggerAdapter } from "./common/providers/nestjs-logger.adapter";
import { CatchAllFilter } from "./common/filters/catch-all.filter";
import { DomainErrorFilter } from "./common/filters/domain-error.filter";
import { ZodErrorFilter } from "./common/filters/zod-error.filter";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    IamModule,
    AgentsModule,
  ],
  controllers: [AppController],
  providers: [
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
  exports: ["EventBus", "Logger", "APP_LOGGER"],
})
export class AppModule {}
