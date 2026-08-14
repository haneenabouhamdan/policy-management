import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId: string;
  tenantId: string | null;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext() {
  return requestContext.getStore();
}

export async function runWithTenant<T>(
  tenantId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = requestContext.getStore();
  if (existing) {
    const previous = existing.tenantId;
    existing.tenantId = tenantId;
    try {
      return await fn();
    } finally {
      existing.tenantId = previous;
    }
  }

  return requestContext.run({ requestId: 'bootstrap', tenantId }, fn);
}
