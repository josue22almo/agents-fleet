import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { IamModule } from "./iam/iam.module";

@Module({
  imports: [IamModule],
  controllers: [AppController],
})
export class AppModule {}
