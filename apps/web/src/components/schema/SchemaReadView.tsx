import type { PolicyField, PolicyTypeSchema } from "../../types/api";

function formatValue(value: unknown) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function ImageReadValue({ label, value }: { label: string; value: unknown }) {
  if (typeof value !== "string" || !value.trim()) return "—";
  return (
    <img
      src={value}
      alt={label}
      className="mt-1 max-h-64 w-full rounded-xl border border-ink-100 object-cover"
    />
  );
}

export function constraintHint(field: PolicyField) {
  const parts: string[] = [];
  if (field.required) parts.push("Required");
  if (field.min != null && field.max != null) {
    parts.push(`Min ${field.min} · max ${field.max}`);
  } else if (field.min != null) {
    parts.push(`Min ${field.min}`);
  } else if (field.max != null) {
    parts.push(`Max ${field.max}`);
  }
  if (field.options && field.options.length > 0) {
    parts.push(`Allowed: ${field.options.join(", ")}`);
  }
  return parts.length ? parts.join(" · ") : null;
}

export function SchemaReadView({
  schema,
  attributes,
}: {
  schema: PolicyTypeSchema;
  attributes: Record<string, unknown>;
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
          <dl className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
            {section.fields.map((field) => {
              const hint = constraintHint(field);
              const raw = attributes[field.key];
              const wide =
                field.type === "text" ||
                field.type === "image" ||
                field.type === "multiselect";
              return (
                <div key={field.key} className={wide ? "sm:col-span-2" : undefined}>
                  <dt className="text-xs text-ink-400">{field.label}</dt>
                  {hint ? (
                    <p className="mt-0.5 text-[11px] leading-4 text-ink-400">
                      {hint}
                    </p>
                  ) : null}
                  <dd className="mt-1 text-sm font-medium text-ink-900">
                    {field.type === "image" ? (
                      <ImageReadValue label={field.label} value={raw} />
                    ) : field.type === "text" ? (
                      <span className="block whitespace-pre-wrap font-normal leading-6 text-ink-800">
                        {formatValue(raw)}
                      </span>
                    ) : (
                      formatValue(raw)
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
