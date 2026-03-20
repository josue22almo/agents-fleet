import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { IamModule } from "./iam/iam.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    IamModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
