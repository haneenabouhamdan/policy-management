import { useState } from "react";
import type { PolicyField } from "../../types/api";
import { fileToImageValue } from "../../lib/policyImage";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function ImageField({
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
  const src = typeof value === "string" ? value : "";
  const [localError, setLocalError] = useState("");
  const [busy, setBusy] = useState(false);
  const message = localError || error;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setLocalError("");
    setBusy(true);
    try {
      onChange(await fileToImageValue(file));
    } catch (caught) {
      setLocalError(
        caught instanceof Error ? caught.message : "Could not attach the image",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-[13px] font-medium text-ink-600">
        {field.label}
        {field.required ? <span className="text-red-500"> *</span> : null}
      </legend>
      <p className="text-xs text-ink-400">
        Upload a photo or paste an image URL.
      </p>
      {src ? (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
          <img
            src={src}
            alt={field.label}
            className="max-h-56 w-full object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={cn(
            "inline-flex h-10 cursor-pointer items-center rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-700 transition hover:border-ink-300",
            busy && "pointer-events-none opacity-60",
          )}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          {busy ? "Attaching…" : src ? "Replace photo" : "Upload photo"}
        </label>
        {src ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setLocalError("");
              onChange("");
            }}
          >
            Remove
          </Button>
        ) : null}
      </div>
      <Input
        label="Image URL"
        value={src.startsWith("data:") ? "" : src}
        placeholder="https://"
        onChange={(e) => {
          setLocalError("");
          onChange(e.target.value);
        }}
      />
      {message ? <p className="text-xs text-red-600">{message}</p> : null}
    </fieldset>
  );
}
