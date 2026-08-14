import { cn } from "../../lib/cn";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
};

export function Select({
  className,
  label,
  error,
  options,
  placeholder,
  id,
  ...props
}: SelectProps) {
  const selectId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-[13px] font-medium text-ink-600">{label}</span>
      ) : null}
      <select
        id={selectId}
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-ink-200 bg-white bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat px-3 pr-9 text-sm text-ink-900 outline-none transition hover:border-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100",
          error && "border-red-300 focus:border-red-500 focus:ring-red-100",
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23918b84' stroke-width='1.6'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
