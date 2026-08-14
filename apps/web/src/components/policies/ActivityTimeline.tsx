import type { PolicyEvent, PolicyTypeSchema } from "../../types/api";
import { activityChanges, activityTitle } from "../../lib/policyActivity";

export function ActivityTimeline({
  events,
  schema,
}: {
  events: PolicyEvent[];
  schema?: PolicyTypeSchema;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-400">No activity recorded yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => {
        const changes = activityChanges(event, schema);
        const reason =
          typeof event.payload.reason === "string" ? event.payload.reason : "";
        return (
          <li key={event.id} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-900">
                {activityTitle(event)}
              </p>
              <p className="text-xs text-ink-400">
                {event.actorEmail} · {new Date(event.createdAt).toLocaleString()}
              </p>
              {reason ? (
                <p className="mt-1 text-xs text-ink-500">{reason}</p>
              ) : null}
              {changes.length > 0 ? (
                <ul className="mt-2 space-y-1.5 border-l border-ink-100 pl-3">
                  {changes.map((change) => (
                    <li key={change.label} className="text-xs leading-5 text-ink-600">
                      <span className="font-medium text-ink-800">
                        {change.label}
                      </span>
                      <span className="text-ink-400"> · </span>
                      <span className="text-ink-400">{change.from}</span>
                      <span className="text-ink-300"> → </span>
                      <span>{change.to}</span>
                    </li>
                  ))}
                </ul>
              ) : event.type === "UPDATED" ? (
                <p className="mt-1 text-xs text-ink-400">No field changes.</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
