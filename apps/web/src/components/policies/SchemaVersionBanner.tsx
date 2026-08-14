export function SchemaVersionBanner({
  policyVersion,
  typeVersion,
  productName,
}: {
  policyVersion: number;
  typeVersion: number;
  productName?: string;
}) {
  if (policyVersion >= typeVersion) return null;

  const product = productName || "The product";

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
      <p className="font-medium">Older schema</p>
      <p className="mt-1 text-orange-800/80">
        This record is on v{policyVersion}; {product} is on v{typeVersion}.
        Saving updates this record only.
      </p>
    </div>
  );
}
