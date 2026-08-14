import type { PolicyTypeSchema } from "../../types/api";

function formatValue(value: unknown) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
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
            {section.fields.map((field) => (
              <div key={field.key}>
                <dt className="text-xs text-ink-400">{field.label}</dt>
                <dd className="mt-1 text-sm font-medium text-ink-900">
                  {formatValue(attributes[field.key])}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
