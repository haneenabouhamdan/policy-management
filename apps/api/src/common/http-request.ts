import type { Request } from 'express';
import type { AuthUser } from '../auth/types/auth-user';

export type RequestWithId = Request & {
  requestId?: string;
  user?: AuthUser;
};
