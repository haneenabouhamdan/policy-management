import { apiRequest } from "./client";
import type {
  PolicyType,
  PolicyTypeEvent,
  PolicyTypeSchema,
} from "../types/api";

export function listPolicyTypes() {
  return apiRequest<PolicyType[]>("/policy-types");
}

export function getPolicyType(id: string) {
  return apiRequest<PolicyType>(`/policy-types/${id}`);
}

export function createPolicyType(body: {
  name: string;
  description?: string;
  schema: PolicyTypeSchema;
}) {
  return apiRequest<PolicyType>("/policy-types", { method: "POST", body });
}

export function updatePolicyType(
  id: string,
  body: {
    name?: string;
    description?: string;
    schema?: PolicyTypeSchema;
  },
) {
  return apiRequest<PolicyType>(`/policy-types/${id}`, {
    method: "PATCH",
    body,
  });
}

export function listPolicyTypeEvents(id: string) {
  return apiRequest<PolicyTypeEvent[]>(`/policy-types/${id}/events`);
}
