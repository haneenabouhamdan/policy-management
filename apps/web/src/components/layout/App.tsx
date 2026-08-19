import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { UserMenu } from "./UserMenu";
import { cn } from "../../lib/cn";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-full px-3.5 py-1.5 text-sm transition",
    isActive
      ? "bg-brand-50 font-medium text-brand-700"
      : "text-ink-500 hover:bg-ink-100 hover:text-ink-800",
  );

function TenantLabel() {
  const { user } = useAuth();
  return <>{user?.tenantName || "Policy administration"}</>;
}

export function App() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="relative sticky top-0 z-40 border-b border-ink-200 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-8">
            <div className="leading-tight">
              <p className="font-display text-[15px] text-ink-900">
                Policy admin
              </p>
              <p className="truncate text-[11px] text-ink-400">
                <TenantLabel />
              </p>
            </div>
            <nav
              id="app-nav"
              data-testid="app-nav"
              className={cn(
                "absolute left-0 right-0 top-full z-30 border-b border-ink-200 bg-canvas px-4 py-3 sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0",
                navOpen ? "flex flex-col gap-1" : "hidden sm:flex sm:items-center sm:gap-1",
              )}
            >
              <NavLink
                to="/policies"
                className={linkClass}
                onClick={() => setNavOpen(false)}
              >
                Policies
              </NavLink>
              <NavLink
                to="/policy-types"
                className={linkClass}
                onClick={() => setNavOpen(false)}
              >
                Products
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100 sm:hidden"
              aria-expanded={navOpen}
              aria-controls="app-nav"
              data-testid="nav-toggle"
              onClick={() => setNavOpen((open) => !open)}
            >
              <span className="sr-only">Menu</span>
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
                {navOpen ? (
                  <path
                    d="M5 5l10 10M15 5 5 15"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M4 6h12M4 10h12M4 14h12"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
        <Outlet />
      </main>
    </div>
  );
}
