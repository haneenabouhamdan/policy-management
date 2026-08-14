import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { cn } from "../../lib/cn";

function initials(name?: string) {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition hover:bg-ink-100",
          open && "bg-ink-100",
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
          {initials(user?.fullName)}
        </span>
        <span className="hidden text-sm font-medium text-ink-800 sm:block">
          {user?.fullName}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
          className={cn(
            "h-4 w-4 text-ink-400 transition",
            open && "rotate-180",
          )}
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 animate-popIn overflow-hidden rounded-xl border border-ink-200 bg-white shadow-menu"
        >
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-medium text-ink-900">{user?.fullName}</p>
            <p className="mt-0.5 truncate text-xs text-ink-400">
              {user?.email}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-orange-700 ring-1 ring-inset ring-orange-200">
              {user?.role}
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-700 transition hover:bg-ink-50"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
              className="h-4 w-4"
            >
              <path
                d="M12.5 13.5 16 10l-3.5-3.5M16 10H7.5M11 3.5H5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
