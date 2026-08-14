import { Button } from "./Button";

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-sm text-ink-400">
        {total} result{total === 1 ? "" : "s"}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-ink-400">
        Page {page} of {totalPages} · {total} results
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
