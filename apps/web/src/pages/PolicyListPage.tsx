import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listPolicies, getPolicySummary } from "../api/policies";
import { listPolicyTypes } from "../api/policy-types";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PolicyDashboardStrip } from "../components/policies/PolicyDashboardStrip";
import { StatusBadge } from "../components/policies/StatusBadge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Pagination } from "../components/ui/Pagination";
import { Select } from "../components/ui/Select";
import { Spinner } from "../components/ui/Spinner";
import type { PolicyField, PolicyStatus } from "../types/api";
import { useDebouncedValue } from "../lib/useDebouncedValue";

const STATUSES: PolicyStatus[] = ["DRAFT", "ACTIVE", "INACTIVE"];

function isStatus(value: string | null): value is PolicyStatus {
  return !!value && STATUSES.includes(value as PolicyStatus);
}

function filterableFields(fields: PolicyField[] | undefined) {
  return (fields || []).filter(
    (field) =>
      (field.type === "select" || field.type === "multiselect") &&
      (field.options || []).length > 0,
  );
}

export function PolicyListPage() {
  const navigate = useNavigate();
  const { canWritePolicies } = useAuth();
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const typeId = params.get("typeId") ?? "";
  const rawStatus = params.get("status");
  const status: PolicyStatus | "" = isStatus(rawStatus) ? rawStatus : "";
  const attrKey = params.get("attrKey") ?? "";
  const attrValue = params.get("attrValue") ?? "";
  const staleSchema = params.get("staleSchema") === "true";
  const after = params.get("after") ?? "";
  const [prevStack, setPrevStack] = useState<string[]>([]);
  const debouncedQ = useDebouncedValue(q, 300);

  function patchFilters(
    next: Record<string, string | number | boolean | null | undefined>,
    resetCursor = true,
  ) {
    const copy = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === undefined || value === "" || value === false) {
        copy.delete(key);
      } else {
        copy.set(key, String(value));
      }
    }
    if (resetCursor) {
      copy.delete("after");
      setPrevStack([]);
    }
    setParams(copy, { replace: true });
  }

  const typesQuery = useQuery({
    queryKey: ["policy-types"],
    queryFn: listPolicyTypes,
  });

  const selectedType = useMemo(
    () => typesQuery.data?.find((type) => type.id === typeId),
    [typesQuery.data, typeId],
  );
  const attributeFields = useMemo(
    () =>
      filterableFields(
        selectedType?.schema.sections.flatMap((section) => section.fields),
      ).slice(0, 2),
    [selectedType],
  );
  const activeAttrField =
    attributeFields.find((field) => field.key === attrKey) ||
    attributeFields[0];

  const filters = useMemo(
    () => ({
      q: debouncedQ.trim() || undefined,
      typeId: typeId || undefined,
      status,
      attrKey:
        typeId && attrValue && activeAttrField
          ? activeAttrField.key
          : undefined,
      attrValue: typeId && attrValue ? attrValue : undefined,
      staleSchema: staleSchema || undefined,
      after: after || undefined,
      limit: 10,
    }),
    [debouncedQ, typeId, status, attrValue, activeAttrField, staleSchema, after],
  );

  const policiesQuery = useQuery({
    queryKey: ["policies", filters],
    queryFn: () => listPolicies(filters),
  });

  const summaryQuery = useQuery({
    queryKey: ["policies", "summary"],
    queryFn: getPolicySummary,
  });

  const hasFilters = Boolean(q || typeId || status || attrValue || staleSchema);

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] leading-tight text-ink-900">
            Policies
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Search and filter policies.
          </p>
        </div>
        {canWritePolicies ? (
          <Button
            data-testid="new-policy"
            onClick={() => navigate("/policies/new")}
          >
            New policy
          </Button>
        ) : null}
      </div>

      {summaryQuery.data ? (
        <PolicyDashboardStrip
          summary={summaryQuery.data}
          status={status}
          typeId={typeId}
          staleSchema={staleSchema}
          onStatus={(next) => {
            patchFilters({
              status: next !== "" && status === next ? null : next || null,
            });
          }}
          onType={(next) => {
            patchFilters({
              typeId: typeId === next ? null : next || null,
              attrKey: null,
              attrValue: null,
            });
          }}
          onStale={() => {
            patchFilters({ staleSchema: staleSchema ? null : true });
          }}
        />
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-panel sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Input
            label="Search"
            placeholder="Name or attribute…"
            value={q}
            onChange={(e) => {
              patchFilters({ q: e.target.value || null });
            }}
          />
        </div>
        {attributeFields.length > 1 ? (
          <div className="sm:w-44">
            <Select
              label="Filter field"
              value={activeAttrField?.key || ""}
              onChange={(e) => {
                patchFilters({
                  attrKey: e.target.value || null,
                  attrValue: null,
                });
              }}
              options={attributeFields.map((field) => ({
                value: field.key,
                label: field.label,
              }))}
            />
          </div>
        ) : null}
        {attributeFields.length > 0 ? (
          <div className="sm:w-44">
            <Select
              label={activeAttrField?.label || "Attribute"}
              placeholder={`All ${activeAttrField?.label || "values"}`}
              value={attrValue}
              onChange={(e) => {
                patchFilters({
                  attrKey: attrKey || activeAttrField?.key || null,
                  attrValue: e.target.value || null,
                });
              }}
              options={(activeAttrField?.options || []).map((option) => ({
                value: option,
                label: option,
              }))}
            />
          </div>
        ) : null}
        <Button
          variant="secondary"
          disabled={!hasFilters}
          onClick={() => {
            setPrevStack([]);
            setParams(new URLSearchParams(), { replace: true });
          }}
        >
          Clear filters
        </Button>
      </div>

      {policiesQuery.isLoading ? <Spinner label="Loading policies…" /> : null}

      {policiesQuery.isError ? (
        <ErrorState
          message={
            policiesQuery.error instanceof ApiError
              ? policiesQuery.error.message
              : "Could not load policies"
          }
          onRetry={() => void policiesQuery.refetch()}
        />
      ) : null}

      {policiesQuery.data && policiesQuery.data.data.length === 0 ? (
        <EmptyState
          title="No policies found"
          description="Try adjusting filters, or create a new draft policy."
          actionLabel={canWritePolicies ? "Create policy" : undefined}
          onAction={
            canWritePolicies ? () => navigate("/policies/new") : undefined
          }
        />
      ) : null}

      {policiesQuery.data && policiesQuery.data.data.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-panel">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50/70 text-[11px] uppercase tracking-[0.1em] text-ink-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {policiesQuery.data.data.map((policy) => (
                <tr key={policy.id} className="transition hover:bg-brand-50/40">
                  <td className="px-5 py-3.5">
                    <Link
                      to={`/policies/${policy.id}`}
                      className="font-medium text-ink-900 decoration-brand-300 underline-offset-4 hover:text-brand-700 hover:underline"
                    >
                      {policy.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-ink-600">
                    {policy.type?.name || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={policy.status} />
                  </td>
                  <td className="px-5 py-3.5 text-ink-400">
                    {new Date(policy.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-ink-100 px-5 py-3">
            <Pagination
              count={policiesQuery.data.data.length}
              hasMore={policiesQuery.data.meta.hasMore}
              canGoBack={prevStack.length > 0 || Boolean(after)}
              onPrevious={() => {
                const next = [...prevStack];
                const previous = next.pop() ?? "";
                setPrevStack(next);
                patchFilters({ after: previous || null }, false);
              }}
              onNext={() => {
                const nextCursor = policiesQuery.data?.meta.nextCursor;
                if (!nextCursor) return;
                setPrevStack((stack) => [...stack, after]);
                patchFilters({ after: nextCursor }, false);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
