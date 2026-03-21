import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CatchAllFilter } from "./common/filters/catch-all.filter";
import { DomainErrorFilter } from "./common/filters/domain-error.filter";
import { ZodErrorFilter } from "./common/filters/zod-error.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new CatchAllFilter(), new DomainErrorFilter(), new ZodErrorFilter());
  await app.listen(4000);
}
bootstrap();
