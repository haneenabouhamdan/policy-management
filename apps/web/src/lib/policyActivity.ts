import type { PolicyEvent, PolicyTypeSchema } from "../types/api";

export type ActivityChange = {
  label: string;
  from: string;
  to: string;
};

type FieldMeta = {
  label: string;
  type?: string;
};

type Snapshot = {
  name?: unknown;
  attributes?: unknown;
  schemaVersion?: unknown;
};

export function activityTitle(event: PolicyEvent) {
  if (event.type === "CREATED") {
    return event.payload.duplicatedFrom ? "Created as a copy" : "Created";
  }
  if (event.type === "STATUS_CHANGED") {
    const from = String(event.payload.from ?? "");
    const to = String(event.payload.to ?? "");
    return from && to ? `Status ${from} → ${to}` : "Status changed";
  }
  return "Updated";
}

export function activityChanges(
  event: PolicyEvent,
  schema?: PolicyTypeSchema,
): ActivityChange[] {
  if (event.type === "STATUS_CHANGED") return [];
  if (event.type === "CREATED") {
    const changes: ActivityChange[] = [];
    if (typeof event.payload.name === "string" && event.payload.name) {
      changes.push({ label: "Name", from: "—", to: event.payload.name });
    }
    if (event.payload.schemaVersion != null) {
      changes.push({
        label: "Schema version",
        from: "—",
        to: String(event.payload.schemaVersion),
      });
    }
    return changes;
  }

  const from = asSnapshot(event.payload.from);
  const to = asSnapshot(event.payload.to);
  if (!from || !to) return [];

  const fields = fieldMeta(schema);
  const changes: ActivityChange[] = [];

  if (from.name !== to.name) {
    changes.push({
      label: "Name",
      from: formatActivityValue(from.name),
      to: formatActivityValue(to.name),
    });
  }

  if (from.schemaVersion !== to.schemaVersion) {
    changes.push({
      label: "Schema version",
      from: formatActivityValue(from.schemaVersion),
      to: formatActivityValue(to.schemaVersion),
    });
  }

  const fromAttrs = asAttributes(from.attributes);
  const toAttrs = asAttributes(to.attributes);
  const keys = new Set([...Object.keys(fromAttrs), ...Object.keys(toAttrs)]);

  for (const key of keys) {
    if (sameValue(fromAttrs[key], toAttrs[key])) continue;
    const meta = fields.get(key);
    const fromText = formatActivityValue(fromAttrs[key], meta?.type);
    const toText = formatActivityValue(toAttrs[key], meta?.type);
    changes.push({
      label: meta?.label || labelFromKey(key),
      from: fromText,
      to:
        fromText === "Image on file" && toText === "Image on file"
          ? "Replaced"
          : toText,
    });
  }

  return changes;
}

export function formatActivityValue(value: unknown, type?: string): string {
  if (isEmpty(value)) return "—";
  if (type === "image" || isUploadedImage(value)) {
    return "Image on file";
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.abs(value) >= 1000
      ? new Intl.NumberFormat("en-US").format(value)
      : String(value);
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => formatActivityValue(item))
      .filter((item) => item !== "—");
    return parts.join(", ") || "—";
  }
  if (typeof value === "string") {
    const compact = value.replace(/\s+/g, " ").trim();
    return compact.length > 90 ? `${compact.slice(0, 87)}…` : compact;
  }
  return String(value);
}

function fieldMeta(schema?: PolicyTypeSchema) {
  const map = new Map<string, FieldMeta>();
  if (!schema) return map;
  for (const section of schema.sections) {
    for (const field of section.fields) {
      map.set(field.key, { label: field.label, type: field.type });
    }
  }
  return map;
}

function asSnapshot(value: unknown): Snapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Snapshot;
}

function asAttributes(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function normalize(value: unknown) {
  if (isEmpty(value)) return null;
  return value;
}

function isEmpty(value: unknown) {
  return (
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function isUploadedImage(value: unknown) {
  return typeof value === "string" && value.startsWith("data:image/");
}

function labelFromKey(key: string) {
  const spaced = key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
