export function clampPage(page: number, totalPages: number) {
  if (!Number.isFinite(page) || page < 1) return 1;
  if (totalPages < 1) return 1;
  return Math.min(page, totalPages);
}
