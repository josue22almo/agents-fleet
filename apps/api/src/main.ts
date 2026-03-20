import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DomainErrorFilter } from "./common/filters/domain-error.filter";
import { ZodErrorFilter } from "./common/filters/zod-error.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new DomainErrorFilter(), new ZodErrorFilter());
  await app.listen(4000);
}
bootstrap();
