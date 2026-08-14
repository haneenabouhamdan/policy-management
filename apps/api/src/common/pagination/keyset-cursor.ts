export type PolicyListCursor = {
  updatedAt: Date;
  id: string;
};

export function encodePolicyCursor(updatedAt: Date, id: string): string {
  return Buffer.from(`${updatedAt.toISOString()}::${id}`, 'utf8').toString(
    'base64url',
  );
}

export function decodePolicyCursor(raw: string): PolicyListCursor | null {
  try {
    const text = Buffer.from(raw, 'base64url').toString('utf8');
    const separator = text.indexOf('::');
    if (separator <= 0) {
      return null;
    }
    const iso = text.slice(0, separator);
    const id = text.slice(separator + 2);
    if (!id) {
      return null;
    }
    const updatedAt = new Date(iso);
    if (Number.isNaN(updatedAt.getTime())) {
      return null;
    }
    return { updatedAt, id };
  } catch {
    return null;
  }
}
