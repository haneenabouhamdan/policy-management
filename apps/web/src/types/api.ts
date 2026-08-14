export type UserRole = "ADMIN" | "UNDERWRITER" | "VIEWER";
export type PolicyStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export type FieldType =
  "string" | "number" | "boolean" | "date" | "select" | "multiselect" | "text";

export type PolicyField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
};

export type PolicySection = {
  id: string;
  title: string;
  fields: PolicyField[];
};

export type PolicyTypeSchema = {
  sections: PolicySection[];
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: AuthUser;
};

export type PolicyType = {
  id: string;
  name: string;
  description: string | null;
  schema: PolicyTypeSchema;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type Policy = {
  id: string;
  typeId: string;
  type?: Pick<PolicyType, "id" | "name"> & Partial<PolicyType>;
  name: string;
  status: PolicyStatus;
  attributes?: Record<string, unknown>;
  schemaVersion: number;
  searchText?: string;
  createdAt: string;
  updatedAt: string;
};

export type PolicyEvent = {
  id: string;
  policyId: string;
  type: "CREATED" | "UPDATED" | "STATUS_CHANGED";
  actorEmail: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type PolicyTypeEvent = {
  id: string;
  typeId: string;
  type: "CREATED" | "UPDATED" | "SCHEMA_CHANGED";
  actorEmail: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type PaginatedPolicies = {
  data: Policy[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PolicySummary = {
  total: number;
  byStatus: Record<PolicyStatus, number>;
  byType: Array<{ id: string; name: string; count: number }>;
  staleSchema: number;
};

export type ApiErrorBody = {
  statusCode?: number;
  message?: string | string[];
  errors?: Array<{ field: string; message: string }>;
};
