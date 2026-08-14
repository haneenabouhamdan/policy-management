import { NavLink, Outlet } from "react-router-dom";
import { UserMenu } from "./UserMenu";
import { cn } from "../../lib/cn";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-full px-3.5 py-1.5 text-sm transition",
    isActive
      ? "bg-brand-50 font-medium text-brand-700"
      : "text-ink-500 hover:bg-ink-100 hover:text-ink-800",
  );

export function AppShell() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-8">
            <div className="leading-tight">
              <p className="font-display text-[15px] text-ink-900">
                Policy admin
              </p>
              <p className="text-[11px] text-ink-400">Policy administration</p>
            </div>
            <nav className="flex items-center gap-1">
              <NavLink to="/policies" className={linkClass}>
                Policies
              </NavLink>
              <NavLink to="/policy-types" className={linkClass}>
                Products
              </NavLink>
            </nav>
          </div>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-9">
        <Outlet />
      </main>
    </div>
  );
}
