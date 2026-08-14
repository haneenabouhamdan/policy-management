import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  duplicatePolicy,
  getPolicy,
  listPolicyEvents,
  updatePolicyStatus,
} from "../api/policies";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ActivityTimeline } from "../components/policies/ActivityTimeline";
import { SchemaVersionBanner } from "../components/policies/SchemaVersionBanner";
import { StatusBadge } from "../components/policies/StatusBadge";
import { SchemaReadView } from "../components/schema/SchemaReadView";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import type { PolicyStatus } from "../types/api";

export function PolicyDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canWritePolicies } = useAuth();
  const [pendingStatus, setPendingStatus] = useState<PolicyStatus | null>(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState("");

  const policyQuery = useQuery({
    queryKey: ["policy", id],
    queryFn: () => getPolicy(id),
    enabled: !!id,
  });

  const eventsQuery = useQuery({
    queryKey: ["policy-events", id],
    queryFn: () => listPolicyEvents(id),
    enabled: !!id,
  });

  const needsReason =
    pendingStatus === "ACTIVE" && policyQuery.data?.status === "INACTIVE";

  const statusMutation = useMutation({
    mutationFn: (status: PolicyStatus) =>
      updatePolicyStatus(id, status, needsReason ? reason.trim() : undefined),
    onSuccess: async () => {
      setPendingStatus(null);
      setReason("");
      setActionError("");
      await queryClient.invalidateQueries({ queryKey: ["policy", id] });
      await queryClient.invalidateQueries({ queryKey: ["policies"] });
      await queryClient.invalidateQueries({ queryKey: ["policy-events", id] });
    },
    onError: (err) => {
      setActionError(
        err instanceof ApiError ? err.message : "Could not update status",
      );
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicatePolicy(id),
    onSuccess: async (copy) => {
      await queryClient.invalidateQueries({ queryKey: ["policies"] });
      navigate(`/policies/${copy.id}`);
    },
    onError: (err) => {
      setActionError(
        err instanceof ApiError ? err.message : "Could not duplicate policy",
      );
    },
  });

  if (policyQuery.isLoading) return <Spinner label="Loading policy…" />;
  if (policyQuery.isError || !policyQuery.data) {
    return (
      <ErrorState
        message={
          policyQuery.error instanceof ApiError
            ? policyQuery.error.message
            : "Policy not found"
        }
        onRetry={() => void policyQuery.refetch()}
      />
    );
  }

  const policy = policyQuery.data;
  const schema = policy.type?.schema;

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/policies"
            className="text-sm font-medium text-ink-400 transition hover:text-brand-700"
          >
            ← Back to policies
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[28px] leading-tight text-ink-900">
              {policy.name}
            </h1>
            <StatusBadge status={policy.status} />
          </div>
          <p className="mt-1.5 text-sm text-ink-500">
            {policy.type?.name || "Unknown product"} · schema v
            {policy.schemaVersion}
            {policy.type?.schemaVersion
              ? ` / product v${policy.type.schemaVersion}`
              : ""}{" "}
            · Updated {new Date(policy.updatedAt).toLocaleString()}
          </p>
        </div>
        {canWritePolicies ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => duplicateMutation.mutate()}
              disabled={duplicateMutation.isPending}
            >
              Duplicate
            </Button>
            <Button
              variant="secondary"
              className="gap-1.5"
              onClick={() => navigate(`/policies/${policy.id}/edit`)}
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden
                className="h-4 w-4"
              >
                <path
                  d="M12.2 4.4 15.6 7.8 7.5 15.9H4.1v-3.4L12.2 4.4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.7 5.9 14.1 9.3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Edit
            </Button>
            {policy.status === "DRAFT" ? (
              <Button onClick={() => setPendingStatus("ACTIVE")}>
                Activate
              </Button>
            ) : null}
            {policy.status === "INACTIVE" ? (
              <Button onClick={() => setPendingStatus("ACTIVE")}>
                Reactivate
              </Button>
            ) : null}
            {policy.status === "DRAFT" || policy.status === "ACTIVE" ? (
              <Button
                variant="secondary"
                onClick={() => setPendingStatus("INACTIVE")}
              >
                Deactivate
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {actionError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      {policy.type?.schemaVersion ? (
        <SchemaVersionBanner
          policyVersion={policy.schemaVersion}
          typeVersion={policy.type.schemaVersion}
          productName={policy.type.name}
        />
      ) : null}

      {schema ? (
        <SchemaReadView schema={schema} attributes={policy.attributes ?? {}} />
      ) : (
        <ErrorState message="Policy type schema is missing on this record." />
      )}

      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-panel">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
          Activity
        </h2>
        <div className="mt-4">
          {eventsQuery.isLoading ? (
            <Spinner label="Loading activity…" />
          ) : (
            <ActivityTimeline events={eventsQuery.data || []} />
          )}
        </div>
      </section>

      <Modal
        open={!!pendingStatus}
        title={
          pendingStatus === "ACTIVE" && policy.status === "INACTIVE"
            ? "Reactivate this policy?"
            : `Mark policy as ${pendingStatus}?`
        }
        confirmLabel={
          pendingStatus === "ACTIVE"
            ? policy.status === "INACTIVE"
              ? "Reactivate"
              : "Activate"
            : "Deactivate"
        }
        busy={statusMutation.isPending}
        confirmDisabled={needsReason && reason.trim().length < 8}
        onClose={() => {
          setPendingStatus(null);
          setReason("");
        }}
        onConfirm={() => {
          if (pendingStatus) statusMutation.mutate(pendingStatus);
        }}
      >
        {needsReason ? (
          <div className="space-y-2">
            <p>Inactive policies need a short reason before they go active again.</p>
            <textarea
              className="min-h-24 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-800 outline-none ring-brand-600/20 focus:ring-2"
              placeholder="Why is cover being reinstated?"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        ) : (
          "This updates the policy status immediately. Only allowed transitions will succeed."
        )}
      </Modal>
    </div>
  );
}
