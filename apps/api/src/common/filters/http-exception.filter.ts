import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ method: string; url: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // In production: never leak stack traces or internal messages for 5xx errors.
    // For 4xx (client errors), the message is safe to return — it's what NestJS
    // ValidationPipe / explicit HttpExceptions set and is intended for clients.
    let message: string;
    if (exception instanceof HttpException) {
      // ValidationPipe returns an object with an array of errors — preserve it.
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const inner = (res as { message: unknown }).message;
        message = Array.isArray(inner) ? inner.join('; ') : String(inner);
      } else {
        message = exception.message;
      }
    } else {
      // Unknown / unexpected error — never expose internals in production
      if (isProd) {
        message = 'An unexpected error occurred';
      } else {
        message = exception instanceof Error ? exception.message : String(exception);
      }
      // Always log unexpected 5xx errors server-side
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      error: message,
      code: HttpStatus[status] ?? 'UNKNOWN_ERROR',
      statusCode: status,
    });
  }
}
