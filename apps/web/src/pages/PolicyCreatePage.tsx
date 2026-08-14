import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPolicy } from "../api/policies";
import { listPolicyTypes } from "../api/policy-types";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  SchemaForm,
  validateSchemaValues,
} from "../components/schema/SchemaForm";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Spinner } from "../components/ui/Spinner";

export function PolicyCreatePage() {
  const { canWritePolicies } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [typeId, setTypeId] = useState("");
  const [name, setName] = useState("");
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const typesQuery = useQuery({
    queryKey: ["policy-types"],
    queryFn: listPolicyTypes,
  });

  const selectedType = useMemo(
    () => typesQuery.data?.find((type) => type.id === typeId),
    [typesQuery.data, typeId],
  );

  const createMutation = useMutation({
    mutationFn: createPolicy,
    onSuccess: async (policy) => {
      await queryClient.invalidateQueries({ queryKey: ["policies"] });
      navigate(`/policies/${policy.id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const mapped: Record<string, string> = {};
        for (const item of err.body.errors || []) {
          mapped[item.field] = item.message;
        }
        setFieldErrors(mapped);
        setFormError(err.message);
        return;
      }
      setFormError("Could not create policy");
    },
  });

  if (!canWritePolicies) {
    return <Navigate to="/policies" replace />;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    if (!selectedType) {
      setFormError("Select a product first");
      return;
    }
    if (!name.trim()) {
      setFormError("Policy name is required");
      return;
    }
    const errors = validateSchemaValues(selectedType.schema, attributes);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError("Fix the highlighted fields");
      return;
    }
    createMutation.mutate({
      typeId: selectedType.id,
      name: name.trim(),
      attributes,
    });
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <Link
          to="/policies"
          className="text-sm font-medium text-ink-400 transition hover:text-brand-700"
        >
          ← Back to policies
        </Link>
        <h1 className="mt-3 font-display text-[28px] leading-tight text-ink-900">
          New policy
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Choose a product, then complete its configuration fields.
        </p>
      </div>

      {typesQuery.isLoading ? <Spinner label="Loading products…" /> : null}
      {typesQuery.isError ? (
        <ErrorState
          message={
            typesQuery.error instanceof ApiError
              ? typesQuery.error.message
              : "Could not load products"
          }
        />
      ) : null}

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-panel md:grid-cols-2">
          <Select
            id="product-select"
            label="Product *"
            placeholder="Select product…"
            value={typeId}
            onChange={(e) => {
              setTypeId(e.target.value);
              setAttributes({});
              setFieldErrors({});
            }}
            options={(typesQuery.data || []).map((type) => ({
              value: type.id,
              label: type.name,
            }))}
          />
          <Input
            id="policy-name"
            label="Policy name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. UAE Weekend Cover"
          />
        </div>

        {selectedType ? (
          <SchemaForm
            schema={selectedType.schema}
            values={attributes}
            errors={fieldErrors}
            onChange={setAttributes}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white/70 px-5 py-12 text-center text-sm text-ink-400">
            Select a product to load its configuration form.
          </div>
        )}

        {formError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={createMutation.isPending}
            data-testid="create-draft"
          >
            {createMutation.isPending ? "Saving…" : "Create draft"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/policies")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
