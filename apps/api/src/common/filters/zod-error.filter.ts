import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { ZodError } from "zod";
import { Response } from "express";

@Catch(ZodError)
export class ZodErrorFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
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
}
