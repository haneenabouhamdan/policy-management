import { useMemo, useState } from "react";
import type { FieldType, PolicyField, PolicyTypeSchema } from "../../types/api";
import { SchemaForm } from "./SchemaForm";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

export const FIELD_TYPE_OPTIONS: Array<{ value: FieldType; label: string }> = [
  { value: "string", label: "Short text" },
  { value: "text", label: "Text area" },
  { value: "image", label: "Image" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / No" },
  { value: "date", label: "Date" },
  { value: "select", label: "Single select" },
  { value: "multiselect", label: "Multi select" },
];

export type DraftField = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  optionsText: string;
  min: string;
  max: string;
};

export type DraftSection = {
  id?: string;
  title: string;
  fields: DraftField[];
};

export function emptyField(): DraftField {
  return {
    key: "",
    label: "",
    type: "string",
    required: true,
    optionsText: "",
    min: "",
    max: "",
  };
}

export function emptySection(title = "Details"): DraftSection {
  return { title, fields: [emptyField()] };
}

export function draftsFromSchema(schema: PolicyTypeSchema): DraftSection[] {
  return schema.sections.map((section) => ({
    id: section.id,
    title: section.title,
    fields: section.fields.map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      required: Boolean(field.required),
      optionsText: (field.options || []).join(", "),
      min: field.min == null ? "" : String(field.min),
      max: field.max == null ? "" : String(field.max),
    })),
  }));
}

function toCamel(label: string, fallback: string) {
  const parts = label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/);
  if (parts.length === 0 || !parts[0]) return fallback;
  return parts
    .map((part, i) =>
      i === 0
        ? part.toLowerCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join("");
}

function toSlug(title: string, fallback: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return slug || fallback;
}

export function buildSchemaFromDraft(sections: DraftSection[]): {
  schema?: PolicyTypeSchema;
  error?: string;
} {
  if (sections.length === 0) {
    return { error: "Add at least one section" };
  }

  const builtSections = sections.map((section, sectionIndex) => {
    const fields: PolicyField[] = section.fields.map((field, index) => {
      const key = field.key.trim() || toCamel(field.label, `field${index + 1}`);
      const options =
        field.type === "select" || field.type === "multiselect"
          ? field.optionsText
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined;
      const min =
        field.type === "number" && field.min !== ""
          ? Number(field.min)
          : undefined;
      const max =
        field.type === "number" && field.max !== ""
          ? Number(field.max)
          : undefined;

      return {
        key,
        label: field.label.trim() || key,
        type: field.type,
        required: field.required,
        options,
        min: Number.isFinite(min) ? min : undefined,
        max: Number.isFinite(max) ? max : undefined,
      };
    });

    return {
      id: section.id || toSlug(section.title, `section${sectionIndex + 1}`),
      title: section.title.trim() || `Section ${sectionIndex + 1}`,
      fields,
    };
  });

  if (builtSections.some((section) => section.fields.some((f) => !f.label))) {
    return { error: "Each field needs a label" };
  }

  if (
    builtSections.some((section) =>
      section.fields.some(
        (field) =>
          (field.type === "select" || field.type === "multiselect") &&
          (!field.options || field.options.length === 0),
      ),
    )
  ) {
    return { error: "Select fields need comma-separated options" };
  }

  return { schema: { sections: builtSections } };
}

export function ProductSchemaBuilder({
  sections,
  onChange,
}: {
  sections: DraftSection[];
  onChange: (sections: DraftSection[]) => void;
}) {
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>(
    {},
  );
  const built = useMemo(() => buildSchemaFromDraft(sections), [sections]);

  function patchSection(index: number, next: DraftSection) {
    const copy = [...sections];
    copy[index] = next;
    onChange(copy);
  }

  function patchField(
    sectionIndex: number,
    fieldIndex: number,
    next: DraftField,
  ) {
    const section = sections[sectionIndex];
    const fields = [...section.fields];
    fields[fieldIndex] = next;
    patchSection(sectionIndex, { ...section, fields });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className="space-y-3 rounded-xl border border-ink-100 bg-ink-50/40 p-4"
          >
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label={`Section ${sectionIndex + 1} title`}
                  value={section.title}
                  onChange={(e) =>
                    patchSection(sectionIndex, {
                      ...section,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={sections.length === 1}
                onClick={() =>
                  onChange(sections.filter((_, i) => i !== sectionIndex))
                }
              >
                Remove section
              </Button>
            </div>

            {section.fields.map((field, fieldIndex) => (
              <div
                key={fieldIndex}
                className="grid gap-3 rounded-xl border border-ink-100 bg-white p-3 md:grid-cols-2"
              >
                <Input
                  label="Label"
                  value={field.label}
                  onChange={(e) =>
                    patchField(sectionIndex, fieldIndex, {
                      ...field,
                      label: e.target.value,
                    })
                  }
                />
                <Select
                  label="Type"
                  value={field.type}
                  options={FIELD_TYPE_OPTIONS}
                  onChange={(e) =>
                    patchField(sectionIndex, fieldIndex, {
                      ...field,
                      type: e.target.value as FieldType,
                    })
                  }
                />
                {(field.type === "select" || field.type === "multiselect") && (
                  <div className="md:col-span-2">
                    <Input
                      label="Options (comma-separated)"
                      value={field.optionsText}
                      onChange={(e) =>
                        patchField(sectionIndex, fieldIndex, {
                          ...field,
                          optionsText: e.target.value,
                        })
                      }
                      placeholder="Basic, Plus, Premium"
                    />
                  </div>
                )}
                {field.type === "image" ? (
                  <p className="md:col-span-2 text-xs text-ink-400">
                    Underwriters can upload a photo or paste an image URL when
                    issuing a policy.
                  </p>
                ) : null}
                {field.type === "number" ? (
                  <>
                    <Input
                      label="Min"
                      type="number"
                      value={field.min}
                      onChange={(e) =>
                        patchField(sectionIndex, fieldIndex, {
                          ...field,
                          min: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Max"
                      type="number"
                      value={field.max}
                      onChange={(e) =>
                        patchField(sectionIndex, fieldIndex, {
                          ...field,
                          max: e.target.value,
                        })
                      }
                    />
                  </>
                ) : null}
                <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-ink-300"
                    checked={field.required}
                    onChange={(e) =>
                      patchField(sectionIndex, fieldIndex, {
                        ...field,
                        required: e.target.checked,
                      })
                    }
                  />
                  Required
                </label>
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={section.fields.length === 1}
                    onClick={() =>
                      patchSection(sectionIndex, {
                        ...section,
                        fields: section.fields.filter(
                          (_, i) => i !== fieldIndex,
                        ),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                patchSection(sectionIndex, {
                  ...section,
                  fields: [...section.fields, emptyField()],
                })
              }
            >
              Add field
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            onChange([
              ...sections,
              emptySection(`Section ${sections.length + 1}`),
            ])
          }
        >
          Add section
        </Button>
      </div>

      <aside className="h-fit rounded-xl border border-dashed border-ink-200 bg-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
          Live preview
        </p>
        <p className="mt-1 text-xs text-ink-400">
          How the form will look when issuing a policy.
        </p>
        <div className="mt-4">
          {built.schema ? (
            <SchemaForm
              schema={built.schema}
              values={previewValues}
              onChange={setPreviewValues}
            />
          ) : (
            <p className="text-sm text-ink-400">
              {built.error || "Complete the schema to preview."}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
