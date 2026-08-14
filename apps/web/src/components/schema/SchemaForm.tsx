import type { PolicyField, PolicyTypeSchema } from "../../types/api";
import { cn } from "../../lib/cn";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

export { validateSchemaValues } from "../../lib/validateSchemaValues";

function FieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: PolicyField;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex h-10 items-center gap-2.5 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-700 transition hover:border-ink-300">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-ink-300"
        />
        {field.label}
        {field.required ? <span className="text-red-500">*</span> : null}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <Select
        label={`${field.label}${field.required ? " *" : ""}`}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Select…"
        options={(field.options || []).map((option) => ({
          value: option,
          label: option,
        }))}
        error={error}
      />
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset className="space-y-2">
        <legend className="text-[13px] font-medium text-ink-600">
          {field.label}
          {field.required ? <span className="text-red-500"> *</span> : null}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(field.options || []).map((option) => {
            const checked = selected.includes(option);
            return (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                  checked
                    ? "border-brand-300 bg-brand-50 text-brand-800"
                    : "border-ink-200 bg-white text-ink-600 hover:border-ink-300",
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink-300"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selected, option]);
                    else onChange(selected.filter((item) => item !== option));
                  }}
                />
                {option}
              </label>
            );
          })}
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </fieldset>
    );
  }

  if (field.type === "text") {
    return (
      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium text-ink-600">
          {field.label}
          {field.required ? <span className="text-red-500"> *</span> : null}
        </span>
        <textarea
          className={cn(
            "min-h-24 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 hover:border-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100",
            error && "border-red-300 focus:border-red-500",
          )}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </label>
    );
  }

  const inputType =
    field.type === "number"
      ? "number"
      : field.type === "date"
        ? "date"
        : "text";

  return (
    <Input
      label={`${field.label}${field.required ? " *" : ""}`}
      type={inputType}
      value={value == null ? "" : String(value)}
      min={field.min}
      max={field.max}
      onChange={(e) => {
        if (field.type === "number") {
          onChange(e.target.value === "" ? "" : Number(e.target.value));
          return;
        }
        onChange(e.target.value);
      }}
      error={error}
    />
  );
}

export function SchemaForm({
  schema,
  values,
  errors,
  onChange,
}: {
  schema: PolicyTypeSchema;
  values: Record<string, unknown>;
  errors?: Record<string, string>;
  onChange: (values: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-5">
      {schema.sections.map((section) => (
        <section
          key={section.id}
          className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-panel"
        >
          <header className="flex items-center gap-2.5 border-b border-ink-100 bg-ink-50/70 px-5 py-3">
            <span className="h-3.5 w-1 rounded-full bg-brand-600" />
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              {section.title}
            </h3>
          </header>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {section.fields.map((field) => (
              <div
                key={field.key}
                className={
                  field.type === "text" || field.type === "multiselect"
                    ? "md:col-span-2"
                    : undefined
                }
              >
                <FieldControl
                  field={field}
                  value={values[field.key]}
                  error={errors?.[field.key]}
                  onChange={(next) =>
                    onChange({ ...values, [field.key]: next })
                  }
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
