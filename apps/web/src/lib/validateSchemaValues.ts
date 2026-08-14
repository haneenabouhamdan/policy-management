import type { PolicyTypeSchema } from "../types/api";

export function validateSchemaValues(
  schema: PolicyTypeSchema,
  values: Record<string, unknown>,
) {
  const errors: Record<string, string> = {};

  for (const section of schema.sections) {
    for (const field of section.fields) {
      const value = values[field.key];
      const empty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);

      if (field.required && empty) {
        errors[field.key] = "Required";
        continue;
      }
      if (empty) continue;

      if (field.type === "number" && typeof value === "number") {
        if (!Number.isFinite(value)) {
          errors[field.key] = "Must be a number";
          continue;
        }
        if (field.min != null && value < field.min) {
          errors[field.key] = `Must be at least ${field.min}`;
        }
        if (field.max != null && value > field.max) {
          errors[field.key] = `Must be at most ${field.max}`;
        }
      }

      if (field.type === "image" && typeof value === "string") {
        const ok =
          /^https?:\/\/\S+$/i.test(value.trim()) ||
          /^data:image\//i.test(value);
        if (!ok) errors[field.key] = "Upload an image or paste a URL";
      }

      if (
        (field.type === "select" || field.type === "multiselect") &&
        field.options?.length
      ) {
        if (field.type === "select" && !field.options.includes(String(value))) {
          errors[field.key] = "Choose a valid option";
        }
        if (field.type === "multiselect" && Array.isArray(value)) {
          const invalid = value.some(
            (item) => !field.options?.includes(String(item)),
          );
          if (invalid) errors[field.key] = "Choose valid options";
        }
      }
    }
  }

  return errors;
}
