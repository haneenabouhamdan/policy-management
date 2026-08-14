const MAX_DATA_URL_CHARS = 560_000;
const MAX_EDGE = 1280;

export function isImageValue(value: string) {
  if (/^https?:\/\/\S+$/i.test(value.trim())) return true;
  return /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(
    value,
  );
}

export async function fileToImageValue(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a PNG, JPEG, GIF, or WebP image");
  }
  const dataUrl = await readFileAsDataUrl(file);
  if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl;
  const compressed = await compressImage(dataUrl);
  if (compressed.length > MAX_DATA_URL_CHARS) {
    throw new Error("Image is too large. Try a smaller photo.");
  }
  return compressed;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not compress the image"));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => reject(new Error("Could not read the image"));
    image.src = dataUrl;
  });
}
