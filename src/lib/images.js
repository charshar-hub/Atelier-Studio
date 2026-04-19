// Client-side image handling for lesson blocks and teaching cards.
// Images are stored inline as data URLs — courses live in a single JSON
// column, so we aggressively resize before encoding to keep row sizes sane.

export async function fileToResizedDataURL(
  file,
  { maxWidth = 1200, quality = 0.85 } = {},
) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Not an image file');
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  // PNGs with transparency stay PNG; everything else becomes a JPEG for size.
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(type, quality);
}

// Four presets — no freeform resizing. Percentages are tuned to feel
// proportioned on the block column; `full` stretches to the container.
export const IMAGE_WIDTH_CLASS = {
  small: 'max-w-[45%]',
  medium: 'max-w-[68%]',
  large: 'max-w-[88%]',
  full: 'w-full',
};

export const IMAGE_WIDTH_VALUES = ['small', 'medium', 'large', 'full'];

export function imageWidthClass(width) {
  return IMAGE_WIDTH_CLASS[width] || IMAGE_WIDTH_CLASS.full;
}

// Used at the block level (Comparison) where a single preset controls the
// total figure width rather than an individual image. Smaller max-widths
// keep the comparison from dominating the lesson column.
export const BLOCK_WIDTH_CLASS = {
  small: 'max-w-[55%]',
  medium: 'max-w-[78%]',
  large: 'max-w-[94%]',
  full: 'w-full',
};

export function blockWidthClass(width) {
  return BLOCK_WIDTH_CLASS[width] || BLOCK_WIDTH_CLASS.full;
}
