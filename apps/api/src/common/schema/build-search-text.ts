function toSearchPart(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => toSearchPart(item))
      .filter((item): item is string => item != null)
      .join(' ');
  }
  return null;
}

export function buildSearchText(
  name: string,
  attributes: Record<string, unknown>,
): string {
  const parts = [name];

  for (const value of Object.values(attributes)) {
    const part = toSearchPart(value);
    if (part) parts.push(part);
  }

  return parts.join(' ').toLowerCase().slice(0, 2000);
}
