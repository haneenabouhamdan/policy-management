import type { PolicyEvent } from "../../types/api";

function titleFor(event: PolicyEvent) {
  if (event.type === "CREATED") return "Created";
  if (event.type === "STATUS_CHANGED") {
    const from = String(event.payload.from ?? "");
    const to = String(event.payload.to ?? "");
    return `Status ${from} → ${to}`;
  }
  return "Updated";
}

export function ActivityTimeline({ events }: { events: PolicyEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-400">No activity recorded yet.</p>;
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
