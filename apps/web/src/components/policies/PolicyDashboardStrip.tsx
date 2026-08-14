import { cn } from "../../lib/cn";
import type { PolicyStatus, PolicySummary } from "../../types/api";

const STATUS_CARDS: Array<{
  key: PolicyStatus | "";
  label: string;
  accent: string;
}> = [
  { key: "", label: "All", accent: "bg-brand-600" },
  { key: "DRAFT", label: "Draft", accent: "bg-orange-400" },
  { key: "ACTIVE", label: "Active", accent: "bg-green-500" },
  { key: "INACTIVE", label: "Inactive", accent: "bg-ink-300" },
];

export function PolicyDashboardStrip({
  summary,
  status,
  typeId,
  staleSchema,
  onStatus,
  onType,
  onStale,
}: {
  summary: PolicySummary;
  status: PolicyStatus | "";
  typeId: string;
  staleSchema: boolean;
  onStatus: (status: PolicyStatus | "") => void;
  onType: (typeId: string) => void;
  onStale: () => void;
}) {
  const statusCount = (key: PolicyStatus | "") =>
    key === "" ? summary.total : summary.byStatus[key];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STATUS_CARDS.map((card) => {
          const selected = status === card.key;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onStatus(card.key)}
              className={cn(
                "rounded-2xl border bg-white px-4 py-3 text-left shadow-panel transition",
                selected
                  ? "border-brand-300 ring-4 ring-brand-100"
                  : "border-ink-100 hover:border-brand-200 hover:bg-brand-50/40",
              )}
            >
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                <span className={cn("h-1.5 w-1.5 rounded-full", card.accent)} />
                {card.label}
              </span>
              <span className="mt-1.5 block font-display text-2xl leading-none text-ink-900">
                {statusCount(card.key)}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onStale}
          className={cn(
            "rounded-2xl border px-4 py-3 text-left shadow-panel transition",
            staleSchema
              ? "border-orange-300 bg-orange-50 ring-4 ring-orange-100"
              : "border-ink-100 bg-white hover:border-orange-200 hover:bg-orange-50/50",
          )}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
            Behind schema
          </span>
          <span className="mt-1.5 block font-display text-2xl leading-none text-ink-900">
            {summary.staleSchema}
          </span>
        </button>
      </div>

      {summary.byType.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {summary.byType.map((type) => {
            const selected = typeId === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onType(type.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition",
                  selected
                    ? "bg-brand-700 text-white"
                    : "bg-white text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                {type.name}
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    selected ? "text-white/80" : "text-ink-400",
                  )}
                >
                  {type.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
