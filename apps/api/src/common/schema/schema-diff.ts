import type { PolicyField, PolicyTypeSchema } from './policy-schema';

export type SchemaChangeSummary = {
  added: string[];
  removed: string[];
  changed: string[];
};

function fieldMap(schema: PolicyTypeSchema) {
  const map = new Map<string, PolicyField>();
  for (const section of schema.sections) {
    for (const field of section.fields) {
      map.set(field.key, field);
    }
  }
  return map;
}

function fieldSignature(field: PolicyField) {
  return JSON.stringify({
    label: field.label,
    type: field.type,
    required: Boolean(field.required),
    min: field.min ?? null,
    max: field.max ?? null,
    options: field.options ?? [],
  });
}

export function summarizeSchemaChange(
  from: PolicyTypeSchema,
  to: PolicyTypeSchema,
): SchemaChangeSummary {
  const before = fieldMap(from);
  const after = fieldMap(to);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const [key, field] of after) {
    const previous = before.get(key);
    if (!previous) {
      added.push(field.label || key);
      continue;
    }
    if (fieldSignature(previous) !== fieldSignature(field)) {
      changed.push(field.label || key);
    }
  }

  for (const [key, field] of before) {
    if (!after.has(key)) {
      removed.push(field.label || key);
    }
  }

  return { added, removed, changed };
}
