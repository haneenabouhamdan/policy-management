import { apiRequest } from "./client";
import type {
  PaginatedPolicies,
  Policy,
  PolicyEvent,
  PolicyStatus,
  PolicySummary,
} from "../types/api";

export type ListPoliciesParams = {
  q?: string;
  typeId?: string;
  status?: PolicyStatus | "";
  attrKey?: string;
  attrValue?: string;
  staleSchema?: boolean;
  after?: string;
  limit?: number;
};

export function listPolicies(params: ListPoliciesParams) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.typeId) query.set("typeId", params.typeId);
  if (params.status) query.set("status", params.status);
  if (params.attrKey) query.set("attrKey", params.attrKey);
  if (params.attrValue) query.set("attrValue", params.attrValue);
  if (params.staleSchema) query.set("staleSchema", "true");
  if (params.after) query.set("after", params.after);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiRequest<PaginatedPolicies>(`/policies${qs ? `?${qs}` : ""}`);
}

export function getPolicySummary() {
  return apiRequest<PolicySummary>("/policies/summary");
}

export function getPolicy(id: string) {
  return apiRequest<Policy>(`/policies/${id}`);
}

export function createPolicy(body: {
  typeId: string;
  name: string;
  attributes: Record<string, unknown>;
}) {
  return apiRequest<Policy>("/policies", { method: "POST", body });
}

export function updatePolicy(
  id: string,
  body: { name?: string; attributes?: Record<string, unknown> },
) {
  return apiRequest<Policy>(`/policies/${id}`, { method: "PATCH", body });
}

export function updatePolicyStatus(
  id: string,
  status: PolicyStatus,
  reason?: string,
) {
  return apiRequest<Policy>(`/policies/${id}/status`, {
    method: "PATCH",
    body: { status, reason },
  });
}

export function duplicatePolicy(id: string) {
  return apiRequest<Policy>(`/policies/${id}/duplicate`, { method: "POST" });
}

export function listPolicyEvents(id: string) {
  return apiRequest<PolicyEvent[]>(`/policies/${id}/events`);
}
