import { Button } from "./Button";

export function Pagination({
  hasMore,
  canGoBack,
  count,
  onPrevious,
  onNext,
}: {
  hasMore: boolean;
  canGoBack: boolean;
  count: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (!hasMore && !canGoBack) {
    return (
      <p className="text-sm text-ink-400">
        {count} result{count === 1 ? "" : "s"}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-ink-400">
        {count} on this page
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!canGoBack}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!hasMore}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
