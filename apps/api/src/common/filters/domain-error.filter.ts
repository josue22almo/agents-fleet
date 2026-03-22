import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Inject, LoggerService } from "@nestjs/common";
import { DomainError } from "@repo/contexts/_shared";
import { Response } from "express";

const ERROR_STATUS_MAP: Record<string, HttpStatus> = {
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  ORGANIZATION_NOT_FOUND: HttpStatus.NOT_FOUND,
  SLUG_ALREADY_TAKEN: HttpStatus.CONFLICT,
  ALREADY_MEMBER: HttpStatus.CONFLICT,
  INSUFFICIENT_PERMISSIONS: HttpStatus.FORBIDDEN,
  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  INVALID_TOKEN: HttpStatus.UNAUTHORIZED,
  INVITATION_EXPIRED: HttpStatus.GONE,
  INVITATION_ALREADY_RESPONDED: HttpStatus.CONFLICT,
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  constructor(@Inject("APP_LOGGER") private readonly logger: LoggerService) {}

  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = ERROR_STATUS_MAP[exception.code] ?? HttpStatus.BAD_REQUEST;

    this.logger.warn?.(`Domain error: ${exception.code} - ${exception.message}`, "DomainErrorFilter");

    response.status(status).json({
      error: {
        code: exception.code,
        message: exception.message,
      },
    });
  }
}
