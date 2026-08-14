import type { PolicyTypeEvent } from "../../types/api";

function joinLabels(values: unknown) {
  if (!Array.isArray(values) || values.length === 0) return "";
  return values.map(String).join(", ");
}

function titleFor(event: PolicyTypeEvent) {
  if (event.type === "CREATED") {
    return `Created as schema v${event.payload.schemaVersion ?? 1}`;
  }

  if (event.type === "SCHEMA_CHANGED") {
    const from = event.payload.fromVersion ?? "?";
    const to = event.payload.toVersion ?? "?";
    const parts = [
      joinLabels(event.payload.added)
        ? `added ${joinLabels(event.payload.added)}`
        : "",
      joinLabels(event.payload.removed)
        ? `removed ${joinLabels(event.payload.removed)}`
        : "",
      joinLabels(event.payload.changed)
        ? `changed ${joinLabels(event.payload.changed)}`
        : "",
    ].filter(Boolean);
    return parts.length > 0
      ? `Schema v${from} → v${to} · ${parts.join("; ")}`
      : `Schema v${from} → v${to}`;
  }

  const name = event.payload.name as { from?: string; to?: string } | undefined;
  if (name?.from && name?.to) {
    return `Renamed ${name.from} → ${name.to}`;
  }
  return "Product details updated";
}

export function SchemaHistoryTimeline({
  events,
}: {
  events: PolicyTypeEvent[];
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-ink-400">No schema edits recorded yet.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
          <div>
            <p className="text-sm font-medium text-ink-900">
              {titleFor(event)}
            </p>
            <p className="text-xs text-ink-400">
              {event.actorEmail} · {new Date(event.createdAt).toLocaleString()}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
