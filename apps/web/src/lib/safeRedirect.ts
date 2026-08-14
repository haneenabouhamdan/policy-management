export function safeRedirectPath(value: unknown, fallback = "/policies") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("://") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
