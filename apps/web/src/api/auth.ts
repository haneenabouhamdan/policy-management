import { apiRequest } from "./client";
import type { AuthUser, LoginResponse, TenantOption } from "../types/api";

export function listTenants() {
  return apiRequest<TenantOption[]>("/auth/tenants", { auth: false });
}

export function login(tenantSlug: string, email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { tenantSlug, email, password },
    auth: false,
  });
}

export function getMe() {
  return apiRequest<AuthUser>("/auth/me");
}
