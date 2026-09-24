/**
 * Covers are stored as dataURLs in the `materials` storage key, so their size is charged
 * against a budget shared with every other preference (~5 MB on web). 480px covers the
 * largest render (the 320x230 detail hero, and 220x148 cards at 2x) without overshooting.
 */
const MAX_COVER_SIZE = 480;
const COVER_QUALITY = 0.75;
/** Hard ceiling per cover, so a high-detail photo can't blow the budget on its own */
const MAX_COVER_BYTES = 120 * 1024;
/** Progressively harsher fallbacks, applied only when a photo exceeds the ceiling */
const COVER_FALLBACKS: Array<{ quality: number; size: number }> = [
  { quality: 0.6, size: 480 },
  { quality: 0.6, size: 360 },
  { quality: 0.5, size: 280 },
];

const drawToDataUrl = (image: HTMLImageElement, size: number, quality: number): string => {
  const scale = Math.min(1, size / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');

  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', quality);
};

/** Downscale + re-encode a user photo until it fits the per-cover ceiling */
const encodeCover = (image: HTMLImageElement): string => {
  let dataUrl = drawToDataUrl(image, MAX_COVER_SIZE, COVER_QUALITY);

  for (const { quality, size } of COVER_FALLBACKS) {
    if (dataUrl.length <= MAX_COVER_BYTES) break;

    dataUrl = drawToDataUrl(image, size, quality);
  }

  return dataUrl;
};

export const fileToCoverDataUrl = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      const dataUrl = encodeCover(image);

      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    image.src = url;
  });
