import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white/70 px-6 py-14 text-center">
      <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path
            d="M5 4.5h9l5 5V19a.5.5 0 0 1-.5.5h-13A.5.5 0 0 1 5 19V4.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M13.5 4.5V10h5.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
      <h3 className="font-display text-base text-ink-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
        {description}
      </p>
      {actionLabel && onAction ? (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}
