import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPolicy, updatePolicy } from "../api/policies";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  SchemaForm,
  validateSchemaValues,
} from "../components/schema/SchemaForm";
import { SchemaVersionBanner } from "../components/policies/SchemaVersionBanner";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";

export function PolicyEditPage() {
  const { id = "" } = useParams();
  const { canWritePolicies } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [ready, setReady] = useState(false);

  const policyQuery = useQuery({
    queryKey: ["policy", id],
    queryFn: () => getPolicy(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (!policyQuery.data) return;
    setName(policyQuery.data.name);
    setAttributes(policyQuery.data.attributes || {});
    setReady(true);
  }, [policyQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () => updatePolicy(id, { name: name.trim(), attributes }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["policy", id] });
      await queryClient.invalidateQueries({ queryKey: ["policies"] });
      await queryClient.invalidateQueries({ queryKey: ["policy-events", id] });
      navigate(`/policies/${id}`);
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
      setFormError("Could not update policy");
    },
  });

  if (!canWritePolicies) {
    return <Navigate to="/policies" replace />;
  }

  if (policyQuery.isLoading || !ready) {
    return <Spinner label="Loading policy…" />;
  }

  if (policyQuery.isError || !policyQuery.data?.type?.schema) {
    return (
      <ErrorState
        message={
          policyQuery.error instanceof ApiError
            ? policyQuery.error.message
            : "Policy not found"
        }
      />
    );
  }

  const schema = policyQuery.data.type.schema;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    if (!name.trim()) {
      setFormError("Policy name is required");
      return;
    }
    const errors = validateSchemaValues(schema, attributes);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError("Fix the highlighted fields");
      return;
    }
    updateMutation.mutate();
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <Link
          to={`/policies/${id}`}
          className="text-sm font-medium text-ink-400 transition hover:text-brand-700"
        >
          ← Back to policy
        </Link>
        <h1 className="mt-3 font-display text-[28px] leading-tight text-ink-900">
          Edit policy
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {policyQuery.data.type.name} · schema v
          {policyQuery.data.schemaVersion} (product v
          {policyQuery.data.type.schemaVersion})
        </p>
      </div>

      {policyQuery.data.type.schemaVersion ? (
        <SchemaVersionBanner
          policyVersion={policyQuery.data.schemaVersion}
          typeVersion={policyQuery.data.type.schemaVersion}
          productName={policyQuery.data.type.name}
        />
      ) : null}

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-panel">
          <Input
            label="Policy name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <SchemaForm
          schema={schema}
          values={attributes}
          errors={fieldErrors}
          onChange={setAttributes}
        />

        {formError ? (
          <p
            data-testid="form-error"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" data-testid="save-policy" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/policies/${id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
