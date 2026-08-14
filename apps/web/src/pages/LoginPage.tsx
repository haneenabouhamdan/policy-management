import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listTenants } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { safeRedirectPath } from "../lib/safeRedirect";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = safeRedirectPath(
    (location.state as { from?: string } | null)?.from,
  );

  const tenantsQuery = useQuery({
    queryKey: ["auth", "tenants"],
    queryFn: listTenants,
  });

  const [tenantSlug, setTenantSlug] = useState("atom");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/policies" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(tenantSlug, email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to sign in right now",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-8 shadow-panel sm:p-10">
        <p className="text-sm font-medium text-ink-400">Policy admin</p>
        <h1 className="mt-2 font-display text-2xl text-ink-900">Sign in</h1>
        <p className="mt-2 text-sm text-ink-500">
          Choose your MGA, then sign in. The same email can exist in more than
          one tenant.
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Select
            id="tenant-slug"
            name="tenantSlug"
            label="MGA"
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            options={(tenantsQuery.data || []).map((tenant) => ({
              value: tenant.slug,
              label: tenant.name,
            }))}
            required
          />
          <Input
            id="login-email"
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {tenantsQuery.isError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Could not load MGAs
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Button
            className="w-full"
            disabled={busy || tenantsQuery.isLoading}
            data-testid="login-submit"
          >
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
