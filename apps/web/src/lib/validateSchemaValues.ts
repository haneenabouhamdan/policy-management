import type { PolicyField, PolicyTypeSchema } from "../types/api";

const STRING_MAX = 200;
const TEXT_MAX = 8000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE_DATA_RE =
  /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i;

function isEmpty(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function isImageValue(value: string) {
  if (/^https?:\/\/\S+$/i.test(value.trim())) return true;
  return IMAGE_DATA_RE.test(value);
}

function validateField(field: PolicyField, value: unknown): string | undefined {
  if (isEmpty(value)) {
    return field.required ? "Required" : undefined;
  }

  switch (field.type) {
    case "string":
      if (typeof value !== "string") return "Must be text";
      if (value.length > STRING_MAX) return `Must be at most ${STRING_MAX} characters`;
      return;
    case "text":
      if (typeof value !== "string") return "Must be text";
      if (value.length > TEXT_MAX) return `Must be at most ${TEXT_MAX} characters`;
      return;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return "Must be a number";
      }
      if (field.min != null && value < field.min) {
        return `Must be at least ${field.min}`;
      }
      if (field.max != null && value > field.max) {
        return `Must be at most ${field.max}`;
      }
      return;
    case "boolean":
      if (typeof value !== "boolean") return "Must be yes or no";
      return;
    case "date":
      if (typeof value !== "string" || !DATE_RE.test(value)) {
        return "Use YYYY-MM-DD";
      }
      if (Number.isNaN(Date.parse(value))) return "Invalid date";
      return;
    case "image":
      if (typeof value !== "string" || !isImageValue(value)) {
        return "Upload an image or paste a URL";
      }
      return;
    case "select":
      if (!field.options?.includes(String(value))) {
        return "Choose a valid option";
      }
      return;
    case "multiselect":
      if (!Array.isArray(value)) return "Choose valid options";
      if (value.some((item) => !field.options?.includes(String(item)))) {
        return "Choose valid options";
      }
      return;
    default:
      return;
  }
}

export function validateSchemaValues(
  schema: PolicyTypeSchema,
  values: Record<string, unknown>,
) {
  const errors: Record<string, string> = {};

  for (const section of schema.sections) {
    for (const field of section.fields) {
      const message = validateField(field, values[field.key]);
      if (message) errors[field.key] = message;
    }
  }

  return errors;
}
