import { constraintHint } from "../components/schema/SchemaReadView";
import type { Policy, PolicyField, PolicyTypeSchema } from "../types/api";

export const SNAPSHOT_DISCLAIMER =
  "Working copy only. Not a legal policy document, certificate, or schedule of insurance.";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 54;
const MARGIN_BOTTOM = 56;
const VALUE_X = 220;
const CONTENT_RIGHT = PAGE_WIDTH - MARGIN_X;

type PdfFont = "F1" | "F2";

export type PdfEmbeddedImage = {
  key: string;
  name: string;
  width: number;
  height: number;
  bytes: Uint8Array;
};

type DrawOp =
  | {
      kind: "text";
      x: number;
      y: number;
      font: PdfFont;
      size: number;
      text: string;
    }
  | { kind: "rule"; y: number }
  | {
      kind: "image";
      x: number;
      y: number;
      w: number;
      h: number;
      name: string;
    };

export function isAttributeEmpty(value: unknown) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function formatSnapshotValue(value: unknown) {
  if (isAttributeEmpty(value)) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(formatScalar).join(", ");
  return formatScalar(value);
}

export function emptyFieldPlaceholder(required?: boolean) {
  return required ? "[ Required - not set ]" : "[ Not set ]";
}

export function policySnapshotFilename({
  name,
  product,
  status,
  exportedAt = new Date(),
}: {
  name: string;
  product?: string;
  status?: string;
  exportedAt?: Date;
}) {
  const date = formatDateStamp(exportedAt);
  const parts = [product, name, status, date].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  const filename = sanitizeFilename(parts.join(" - "));
  return `${filename || "Policy working copy"}.pdf`;
}

export function buildPolicySnapshotPdf({
  tenantName,
  policy,
  schema,
  attributes,
  exportedAt = new Date(),
  exportedBy,
  images = [],
}: {
  tenantName: string;
  policy: Pick<
    Policy,
    "name" | "status" | "schemaVersion" | "createdAt" | "updatedAt"
  > & { type?: { name?: string; schemaVersion?: number } };
  schema: PolicyTypeSchema;
  attributes: Record<string, unknown>;
  exportedAt?: Date;
  exportedBy?: string;
  images?: PdfEmbeddedImage[];
}) {
  const product = policy.type?.name || "Unknown product";
  const pages: DrawOp[][] = [[]];
  let y = 742;

  const ensure = (need: number) => {
    if (y - need >= MARGIN_BOTTOM) return;
    pages.push([]);
    y = 742;
  };

  const current = () => pages[pages.length - 1];

  const text = (
    value: string,
    opts: { x?: number; font?: PdfFont; size?: number; gap?: number },
  ) => {
    const size = opts.size ?? 10;
    const font = opts.font ?? "F1";
    const x = opts.x ?? MARGIN_X;
    const widthChars = Math.max(24, Math.floor((CONTENT_RIGHT - x) / charWidth(size)));
    const lines = wrapText(value, widthChars);
    for (const line of lines) {
      ensure(size + 4);
      current().push({ kind: "text", x, y, font, size, text: line });
      y -= opts.gap ?? size + 4;
    }
  };

  const rule = () => {
    ensure(14);
    y -= 4;
    current().push({ kind: "rule", y });
    y -= 14;
  };

  const kv = (label: string, value: string, hint?: string | null) => {
    const valueLines = wrapText(value, 62);
    const hintLines = hint ? wrapText(hint, 52) : [];
    const block = Math.max(valueLines.length, 1) * 13 + hintLines.length * 11 + 8;
    ensure(block);
    current().push({
      kind: "text",
      x: MARGIN_X,
      y,
      font: "F2",
      size: 9,
      text: label,
    });
    valueLines.forEach((line, index) => {
      current().push({
        kind: "text",
        x: VALUE_X,
        y: y - index * 13,
        font: "F1",
        size: 10,
        text: line,
      });
    });
    y -= Math.max(valueLines.length, 1) * 13;
    hintLines.forEach((line) => {
      current().push({
        kind: "text",
        x: VALUE_X,
        y,
        font: "F1",
        size: 8,
        text: line,
      });
      y -= 11;
    });
    y -= 8;
  };

  const imageRow = (label: string, fieldKey: string) => {
    const embedded = images.find((image) => image.key === fieldKey);
    const maxW = CONTENT_RIGHT - VALUE_X;
    const maxH = 128;
    let block = 28;
    let drawW = 0;
    let drawH = 0;
    if (embedded) {
      const scale = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
      drawW = embedded.width * scale;
      drawH = embedded.height * scale;
      block = drawH + 24;
    }
    ensure(block);
    current().push({
      kind: "text",
      x: MARGIN_X,
      y,
      font: "F2",
      size: 9,
      text: label,
    });
    if (embedded) {
      y -= 4;
      current().push({
        kind: "image",
        x: VALUE_X,
        y: y - drawH,
        w: drawW,
        h: drawH,
        name: embedded.name,
      });
      y -= drawH + 16;
      return;
    }
    current().push({
      kind: "text",
      x: VALUE_X,
      y,
      font: "F1",
      size: 10,
      text: "Image on file",
    });
    y -= 21;
  };

  text(tenantName.toUpperCase(), { font: "F2", size: 10, gap: 14 });
  text("Policy working copy", { font: "F1", size: 9, gap: 12 });
  rule();
  text(policy.name, { font: "F2", size: 18, gap: 20 });
  text(policy.status, { font: "F2", size: 11, gap: 16 });
  text(SNAPSHOT_DISCLAIMER, { font: "F1", size: 8, gap: 16 });
  rule();
  text("Summary", { font: "F2", size: 11, gap: 16 });
  kv("Product", product);
  kv("Status", policy.status);
  kv(
    "Schema",
    `Policy v${policy.schemaVersion}${
      policy.type?.schemaVersion ? `  /  product v${policy.type.schemaVersion}` : ""
    }`,
  );
  kv("Created", formatWhen(policy.createdAt));
  kv("Last updated", formatWhen(policy.updatedAt));
  kv("Exported", formatWhen(exportedAt.toISOString()));
  if (exportedBy) kv("Exported by", exportedBy);
  rule();

  for (const section of schema.sections) {
    text(section.title, { font: "F2", size: 11, gap: 16 });
    for (const field of section.fields) {
      if (field.type === "image") {
        const src =
          typeof attributes[field.key] === "string"
            ? String(attributes[field.key])
            : "";
        if (!src.trim()) {
          kv(field.label, emptyFieldPlaceholder(field.required), snapshotHint(field));
          continue;
        }
        imageRow(field.label, field.key);
        continue;
      }
      const value =
        formatSnapshotValue(attributes[field.key]) ||
        emptyFieldPlaceholder(field.required);
      kv(field.label, value, snapshotHint(field));
    }
  }

  return assemblePdf(
    pages.map((ops, index) =>
      renderPage(ops, index + 1, pages.length, tenantName),
    ),
    {
      title: `${policy.name} - ${product} working copy`,
      author: exportedBy || tenantName,
    },
    images,
  );
}

export function downloadPdf(filename: string, bytes: Uint8Array) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function snapshotHint(field: PolicyField) {
  const hint = constraintHint(field);
  if (!hint) return null;
  return hint
    .replace(/ · /g, ". ")
    .replace("Allowed:", "Allowed values:");
}

function formatScalar(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (Math.abs(value) >= 1000) {
      return new Intl.NumberFormat("en-US").format(value);
    }
    return String(value);
  }
  return String(value);
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${hours}:${minutes} UTC`;
}

function formatDateStamp(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function sanitizeFilename(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function charWidth(size: number) {
  return size * 0.5;
}

export function wrapText(text: string, width: number) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    lines.push(...wrapParagraph(toWinAnsi(paragraph), width));
  }
  return lines.length ? lines : [""];
}

function wrapParagraph(normalized: string, width: number) {
  if (normalized.length <= width) return [normalized || ""];
  const words = normalized.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const pieces = word.length > width ? splitLong(word, width) : [word];
    for (const piece of pieces) {
      const next = current ? `${current} ${piece}` : piece;
      if (next.length > width && current) {
        lines.push(current);
        current = piece;
      } else {
        current = next;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function splitLong(word: string, width: number) {
  const parts: string[] = [];
  for (let i = 0; i < word.length; i += width) {
    parts.push(word.slice(i, i + width));
  }
  return parts;
}

function renderPage(
  ops: DrawOp[],
  page: number,
  total: number,
  tenantName: string,
) {
  const footerY = 36;
  const all: DrawOp[] = [
    ...ops,
    { kind: "rule", y: 48 },
    {
      kind: "text",
      x: MARGIN_X,
      y: footerY,
      font: "F1",
      size: 8,
      text: toWinAnsi(tenantName),
    },
    {
      kind: "text",
      x: PAGE_WIDTH - MARGIN_X - 70,
      y: footerY,
      font: "F1",
      size: 8,
      text: `Page ${page} of ${total}`,
    },
  ];

  return all
    .map((op) => {
      if (op.kind === "rule") {
        return [
          "q",
          "0.72 0.72 0.72 RG",
          "0.6 w",
          `${MARGIN_X} ${op.y.toFixed(2)} m ${CONTENT_RIGHT} ${op.y.toFixed(2)} l S`,
          "Q",
        ].join("\n");
      }
      if (op.kind === "image") {
        return [
          "q",
          `${op.w.toFixed(2)} 0 0 ${op.h.toFixed(2)} ${op.x.toFixed(2)} ${op.y.toFixed(2)} cm`,
          `/${op.name} Do`,
          "Q",
        ].join("\n");
      }
      return [
        "BT",
        `/${op.font} ${op.size} Tf`,
        `1 0 0 1 ${op.x.toFixed(2)} ${op.y.toFixed(2)} Tm`,
        `(${escapePdf(op.text)}) Tj`,
        "ET",
      ].join("\n");
    })
    .join("\n");
}

function toWinAnsi(text: string) {
  return Array.from(text)
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code === 9) return " ";
      if (code === 10 || code === 13) return " ";
      if (code >= 32 && code <= 126) return char;
      if (char === "—" || char === "–" || char === "·") return "-";
      if (char === "’" || char === "‘") return "'";
      if (char === "“" || char === "”") return '"';
      return "?";
    })
    .join("");
}

function escapePdf(text: string) {
  return toWinAnsi(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function assemblePdf(
  contentStreams: string[],
  info: { title: string; author: string },
  images: PdfEmbeddedImage[] = [],
) {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets = [0];
  let size = 0;

  const push = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    parts.push(bytes);
    size += bytes.length;
  };

  const fontRegularId = 3;
  const fontBoldId = 4;
  const infoId = 5;
  const firstImageId = 6;
  const firstPageId = firstImageId + images.length;
  const kids = contentStreams
    .map((_, index) => `${firstPageId + index * 2} 0 R`)
    .join(" ");
  const xobjects = images
    .map((image, index) => `/${image.name} ${firstImageId + index} 0 R`)
    .join(" ");
  const xobjectDict = xobjects ? ` /XObject << ${xobjects} >>` : "";

  const objects: Array<string | Uint8Array[]> = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] =
    `<< /Type /Pages /Kids [${kids}] /Count ${contentStreams.length} >>`;
  objects[fontRegularId] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[fontBoldId] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  objects[infoId] =
    `<< /Title (${escapePdf(info.title)}) /Author (${escapePdf(info.author)}) /Creator (Policy admin) /Producer (Policy admin) >>`;

  images.forEach((image, index) => {
    const header = encoder.encode(
      `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`,
    );
    const footer = encoder.encode("\nendstream");
    objects[firstImageId + index] = [header, image.bytes, footer];
  });

  contentStreams.forEach((content, index) => {
    const pageId = firstPageId + index * 2;
    const contentId = pageId + 1;
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >>${xobjectDict} >> /Contents ${contentId} 0 R >>`;
    objects[contentId] =
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  push("%PDF-1.4\n");
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = size;
    push(`${id} 0 obj\n`);
    const object = objects[id];
    if (Array.isArray(object)) {
      object.forEach((chunk) => push(chunk));
    } else {
      push(object);
    }
    push("\nendobj\n");
  }

  const xrefStart = size;
  let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  push(
    xref +
      `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
  );

  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export async function collectPdfImages(
  schema: PolicyTypeSchema,
  attributes: Record<string, unknown>,
): Promise<PdfEmbeddedImage[]> {
  const images: PdfEmbeddedImage[] = [];
  let index = 0;
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.type !== "image") continue;
      const src = attributes[field.key];
      if (typeof src !== "string" || !src.trim()) continue;
      const raster = await rasterizeForPdf(src);
      if (!raster) continue;
      index += 1;
      images.push({ ...raster, key: field.key, name: `Im${index}` });
    }
  }
  return images;
}

async function rasterizeForPdf(src: string) {
  if (/^data:image\/jpe?g;base64,/i.test(src)) {
    const bytes = dataUrlToBytes(src);
    const size = bytes ? jpegDimensions(bytes) : null;
    if (bytes && size) return { bytes, width: size.width, height: size.height };
  }
  if (typeof document === "undefined") return null;
  try {
    const image = await loadHtmlImage(src);
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const bytes = dataUrlToBytes(dataUrl);
    if (!bytes) return null;
    return { bytes, width, height };
  } catch {
    return null;
  }
}

function loadHtmlImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (/^https?:/i.test(src)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image"));
    image.src = src;
  });
}

function dataUrlToBytes(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,([\s\S]+)$/);
  if (!match) return null;
  const binary = atob(match[1].replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function jpegDimensions(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i < bytes.length - 8) {
    if (bytes[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = bytes[i + 1];
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: (bytes[i + 5] << 8) | bytes[i + 6],
        width: (bytes[i + 7] << 8) | bytes[i + 8],
      };
    }
    i += 2 + length;
  }
  return null;
}
