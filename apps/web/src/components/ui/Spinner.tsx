export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      <span>{label}</span>
    </div>
  );
}
