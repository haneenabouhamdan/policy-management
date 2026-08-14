import type { PolicyStatus } from "../../types/api";
import { cn } from "../../lib/cn";

const STYLES: Record<PolicyStatus, { chip: string; dot: string }> = {
  DRAFT: {
    chip: "bg-orange-50 text-orange-700 ring-orange-200",
    dot: "bg-orange-400",
  },
  ACTIVE: {
    chip: "bg-green-50 text-green-700 ring-green-200",
    dot: "bg-green-500",
  },
  INACTIVE: {
    chip: "bg-ink-100 text-ink-500 ring-ink-200",
    dot: "bg-ink-300",
  },
};

export function StatusBadge({ status }: { status: PolicyStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ring-1 ring-inset",
        style.chip,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {status}
    </span>
  );
}
