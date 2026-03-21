import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { AppController } from "./app.controller";
import { IamModule } from "./iam/iam.module";
import { NestJsEventBusAdapter } from "./common/providers/nestjs-event-bus.adapter";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    IamModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: "EventBus",
      useClass: NestJsEventBusAdapter,
    },
  ],
  exports: ["EventBus"],
})
export class AppModule {}
