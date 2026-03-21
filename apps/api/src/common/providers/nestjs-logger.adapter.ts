import { Injectable } from "@nestjs/common";
import { Logger as NestLogger } from "@nestjs/common";
import type { Logger } from "@repo/contexts/_shared";

@Injectable()
export class NestJsLoggerAdapter implements Logger {
  private readonly nest = new NestLogger("App");

  info(message: string, context?: Record<string, unknown>): void {
    this.nest.log(context ? `${message} ${JSON.stringify(context)}` : message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.nest.warn(context ? `${message} ${JSON.stringify(context)}` : message);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.nest.error(context ? `${message} ${JSON.stringify(context)}` : message);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.nest.debug(context ? `${message} ${JSON.stringify(context)}` : message);
  }
}
