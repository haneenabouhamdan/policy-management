import { Button } from "./Button";

export function Modal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  busy,
  confirmDisabled,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  confirmDisabled?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md animate-popIn overflow-hidden rounded-2xl bg-white shadow-lift">
        <div className="p-6">
          <h2 className="font-display text-lg text-ink-900">{title}</h2>
          <div className="mt-3 text-sm text-ink-500">{children}</div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button onClick={onConfirm} disabled={busy || confirmDisabled}>
              {busy ? "Working…" : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
