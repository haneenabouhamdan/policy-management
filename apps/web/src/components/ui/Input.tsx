import { cn } from "../../lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label ? (
        <span className="text-[13px] font-medium text-ink-600">{label}</span>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 hover:border-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100",
          error && "border-red-300 focus:border-red-500 focus:ring-red-100",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
