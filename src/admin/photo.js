// Photos are stored inside the product's Firestore document as a small data URL
// (Firebase Storage needs the paid Blaze plan). Later they can be moved to an image
// host by replacing `imageUrl`; the rest of the app treats both the same way.

const MAX_SIDE = 600;
const MAX_CHARS = 200_000; // ~150 KB; Firestore documents are limited to 1 MB

export const isEmbeddedPhoto = (url) => typeof url === 'string' && url.startsWith('data:image/');

function encode(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Shrinks a phone photo to max 600px (~30–40 KB) and returns it as a data URL. */
export async function photoToDataUrl(file) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo.');

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This photo format is not supported. Try a JPG or PNG.');
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // transparent PNGs get a white background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  // WebP is smaller; browsers that can't encode it return PNG, so fall back to JPEG.
  for (const quality of [0.72, 0.55, 0.4]) {
    let blob = await encode(canvas, 'image/webp', quality);
    if (!blob || blob.type !== 'image/webp') blob = await encode(canvas, 'image/jpeg', quality);
    if (!blob) break;
    const url = await toDataUrl(blob);
    if (url.length <= MAX_CHARS) return url;
  }
  throw new Error('Photo is too detailed to store. Try a simpler photo.');
}
