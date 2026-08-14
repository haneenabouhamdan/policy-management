import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { RequestWithId } from '../http-request';
import { getRequestContext } from '../request-context';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithId>();
    const response = ctx.getResponse<Response>();
    const requestId =
      request.requestId ?? getRequestContext()?.requestId ?? undefined;

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttp ? exception.getResponse() : null;
    const body =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as Record<string, unknown> | null);

    if (!isHttp) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    if (requestId) {
      response.setHeader('X-Request-Id', requestId);
    }

    response.status(status).json({
      statusCode: status,
      message:
        (body?.message as string | string[] | undefined) ??
        (status >= 500 ? 'Internal server error' : 'Request failed'),
      errors: body?.errors,
      requestId,
    });
  }
}
