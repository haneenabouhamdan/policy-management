import { Fragment, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPolicyType,
  listPolicyTypeEvents,
  listPolicyTypes,
  updatePolicyType,
} from "../api/policy-types";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import { SchemaHistoryTimeline } from "../components/schema/SchemaHistoryTimeline";
import {
  ProductSchemaBuilder,
  buildSchemaFromDraft,
  draftsFromSchema,
  emptySection,
  type DraftSection,
} from "../components/schema/ProductSchemaBuilder";
import type { PolicyType } from "../types/api";

export function PolicyTypesPage() {
  const { canManageTypes } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<DraftSection[]>([emptySection()]);
  const [formError, setFormError] = useState("");

  const typesQuery = useQuery({
    queryKey: ["policy-types"],
    queryFn: listPolicyTypes,
  });

  const historyQuery = useQuery({
    queryKey: ["policy-type-events", historyId],
    queryFn: () => listPolicyTypeEvents(historyId as string),
    enabled: !!historyId,
  });

  const editingType = typesQuery.data?.find((type) => type.id === editingId);

  function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setName("");
    setDescription("");
    setSections([emptySection()]);
    setFormError("");
  }

  function openCreate() {
    setEditingId(null);
    setName("");
    setDescription("");
    setSections([emptySection()]);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(type: PolicyType) {
    setEditingId(type.id);
    setName(type.name);
    setDescription(type.description || "");
    setSections(draftsFromSchema(type.schema));
    setFormError("");
    setShowForm(true);
  }

  const createMutation = useMutation({
    mutationFn: createPolicyType,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["policy-types"] });
      await queryClient.invalidateQueries({ queryKey: ["policy-type-events"] });
      resetForm();
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError ? err.message : "Could not create product",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      name: string;
      description?: string;
      schema: PolicyType["schema"];
    }) =>
      updatePolicyType(payload.id, {
        name: payload.name,
        description: payload.description,
        schema: payload.schema,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["policy-types"] });
      await queryClient.invalidateQueries({ queryKey: ["policies"] });
      await queryClient.invalidateQueries({ queryKey: ["policy-type-events"] });
      resetForm();
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError ? err.message : "Could not update product",
      );
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Product name is required");
      return;
    }

    const built = buildSchemaFromDraft(sections);
    if (!built.schema) {
      setFormError(built.error || "Invalid schema");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: name.trim(),
        description: description.trim() || undefined,
        schema: built.schema,
      });
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      schema: built.schema,
    });
  }

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] leading-tight text-ink-900">
            Products
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Schemas that drive policy forms and validation.
          </p>
        </div>
        {canManageTypes ? (
          <Button onClick={() => (showForm ? resetForm() : openCreate())}>
            {showForm ? "Close form" : "New product"}
          </Button>
        ) : null}
      </div>

      {showForm && canManageTypes ? (
        <form
          onSubmit={onSubmit}
          className="animate-popIn space-y-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-panel"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Product name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cyber"
            />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <ProductSchemaBuilder sections={sections} onChange={setSections} />

          {editingId && editingType ? (
            <p className="text-sm text-ink-500">
              Current schema v{editingType.schemaVersion}. Field changes
              increment the version.
            </p>
          ) : (
            <p className="text-sm text-ink-500">Starts at schema v1.</p>
          )}

          {formError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          ) : null}

          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Save product" : "Create product"}
          </Button>
        </form>
      ) : null}

      {typesQuery.isLoading ? <Spinner label="Loading products…" /> : null}
      {typesQuery.isError ? (
        <ErrorState
          message={
            typesQuery.error instanceof ApiError
              ? typesQuery.error.message
              : "Could not load products"
          }
          onRetry={() => void typesQuery.refetch()}
        />
      ) : null}

      {typesQuery.data && typesQuery.data.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create a product schema to start issuing policies against it."
          actionLabel={canManageTypes ? "New product" : undefined}
          onAction={canManageTypes ? openCreate : undefined}
        />
      ) : null}

      {typesQuery.data && typesQuery.data.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-panel">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50/70 text-[11px] uppercase tracking-[0.1em] text-ink-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold">Fields</th>
                <th className="px-5 py-3 font-semibold">Current schema</th>
                <th className="px-5 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {typesQuery.data.map((type) => {
                const fieldCount = type.schema.sections.reduce(
                  (sum, section) => sum + section.fields.length,
                  0,
                );
                const expanded = historyId === type.id;
                return (
                  <Fragment key={type.id}>
                    <tr
                      className={`transition ${
                        expanded ? "bg-brand-50/50" : "hover:bg-brand-50/40"
                      }`}
                    >
                      <td className="px-5 py-3.5 font-medium text-ink-900">
                        {type.name}
                      </td>
                      <td className="px-5 py-3.5 text-ink-500">
                        {type.description || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-ink-600">{fieldCount}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-500 ring-1 ring-inset ring-ink-200">
                          v{type.schemaVersion}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            onClick={() =>
                              setHistoryId(expanded ? null : type.id)
                            }
                          >
                            <svg
                              viewBox="0 0 20 20"
                              fill="none"
                              aria-hidden
                              className="h-3.5 w-3.5"
                            >
                              <path
                                d="M10 5.5V10l2.5 1.5M17 10a7 7 0 1 1-7-7"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M14 4.5v2.5H16.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {expanded ? "Hide" : "History"}
                          </Button>
                          {canManageTypes ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="gap-1.5"
                              onClick={() => openEdit(type)}
                            >
                              <svg
                                viewBox="0 0 20 20"
                                fill="none"
                                aria-hidden
                                className="h-3.5 w-3.5"
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
                              Edit schema
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-ink-50/70">
                        <td colSpan={5} className="px-5 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                            Schema history
                          </p>
                          <div className="mt-3">
                            {historyQuery.isLoading ? (
                              <Spinner label="Loading history…" />
                            ) : (
                              <SchemaHistoryTimeline
                                events={historyQuery.data || []}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
