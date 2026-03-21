import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import type { ZodError } from "zod";
import type { DomainError } from "@repo/contexts/_shared";
import { Response } from "express";

const ERROR_STATUS_MAP: Record<string, HttpStatus> = {
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  ORGANIZATION_NOT_FOUND: HttpStatus.NOT_FOUND,
  SLUG_ALREADY_TAKEN: HttpStatus.CONFLICT,
  ALREADY_MEMBER: HttpStatus.CONFLICT,
  INSUFFICIENT_PERMISSIONS: HttpStatus.FORBIDDEN,
  INVALID_TOKEN: HttpStatus.UNAUTHORIZED,
  INVITATION_EXPIRED: HttpStatus.GONE,
  INVITATION_ALREADY_RESPONDED: HttpStatus.CONFLICT,
};

/**
 * Fallback filter that catches ZodError and DomainError by duck-typing.
 *
 * NestJS's @Catch(SomeClass) relies on instanceof, which can fail when
 * vitest transforms create separate module instances. This catch-all
 * filter is registered first (tried last) as a safety net.
 */
@Catch()
export class CatchAllFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (this.isZodError(exception)) {
      return this.handleZodError(exception as ZodError, host);
    }

    if (this.isDomainError(exception)) {
      return this.handleDomainError(exception as DomainError, host);
    }

    // Re-throw for NestJS default handling (HttpException, etc.)
    throw exception;
  }

  private handleZodError(exception: ZodError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const fieldErrors = exception.flatten().fieldErrors;

    response.status(HttpStatus.BAD_REQUEST).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        fields: fieldErrors,
      },
    });
  }

  private handleDomainError(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = ERROR_STATUS_MAP[exception.code] ?? HttpStatus.BAD_REQUEST;

    response.status(status).json({
      error: {
        code: exception.code,
        message: exception.message,
      },
    });
  }

  private isZodError(exception: unknown): boolean {
    return (
      exception !== null &&
      typeof exception === "object" &&
      "name" in exception &&
      (exception as { name: string }).name === "ZodError" &&
      "flatten" in exception
    );
  }

  private isDomainError(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;
    if (!("code" in exception)) return false;
    const code = (exception as DomainError).code;
    return typeof code === "string" && /^[A-Z][A-Z0-9_]+$/.test(code);
  }
}
