import { apiRequest } from "./client";
import type { AuthUser, LoginResponse } from "../types/api";

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function getMe() {
  return apiRequest<AuthUser>("/auth/me");
}
