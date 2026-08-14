export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm">
      <p className="font-semibold text-red-700">{title}</p>
      <p className="mt-1 text-ink-600">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 font-medium text-red-600 underline underline-offset-4 hover:text-red-700"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
