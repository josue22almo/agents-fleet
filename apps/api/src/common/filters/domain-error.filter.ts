import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import { DomainError } from "@repo/contexts/_shared";
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

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: DomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = ERROR_STATUS_MAP[exception.code] ?? HttpStatus.BAD_REQUEST;

    this.logger.warn(`Domain error: ${exception.code} - ${exception.message}`);

    response.status(status).json({
      error: {
        code: exception.code,
        message: exception.message,
      },
    });
  }
}
