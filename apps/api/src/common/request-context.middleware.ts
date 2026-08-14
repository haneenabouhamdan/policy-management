import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import { requestContext } from './request-context';
import type { RequestWithId } from './http-request';

const REQUEST_ID_PATTERN = /^[\w.:-]{1,128}$/;

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction) {
    const header = req.header('x-request-id');
    const requestId =
      header && REQUEST_ID_PATTERN.test(header) ? header : randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    requestContext.run({ requestId, tenantId: null }, () => next());
  }
}
