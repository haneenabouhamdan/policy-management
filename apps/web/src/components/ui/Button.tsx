import { cn } from "../../lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "h-8 px-3.5 text-sm" : "h-10 px-5 text-sm",
        variant === "primary" &&
          "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900",
        variant === "secondary" &&
          "border border-ink-200 bg-white text-ink-800 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700",
        variant === "ghost" &&
          "text-ink-500 hover:bg-ink-100 hover:text-ink-900",
        variant === "danger" &&
          "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
        className,
      )}
      {...props}
    />
  );
}
