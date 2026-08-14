import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { finalize } from 'rxjs';
import type { RequestWithId } from './http-request';
import { getRequestContext } from './request-context';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithId>();
    const res = http.getResponse<Response>();
    const store = getRequestContext();
    if (store && req.user?.tenantId) {
      store.tenantId = req.user.tenantId;
    }

    const started = Date.now();
    return next.handle().pipe(
      finalize(() => {
        this.logger.log(
          JSON.stringify({
            requestId: req.requestId ?? store?.requestId,
            method: req.method,
            path: req.originalUrl ?? req.url,
            status: res.statusCode,
            ms: Date.now() - started,
            tenantId: store?.tenantId ?? null,
          }),
        );
      }),
    );
  }
}
