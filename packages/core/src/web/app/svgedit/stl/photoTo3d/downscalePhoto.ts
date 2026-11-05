/**
 * The longest side a photo is sent to the photo-to-3D API at.
 *
 * The depth model answers at the input's resolution, and its output grows with the pixel count: an
 * 11 MP photo made a 177 MB JSON that took 50–85 s (and $0.05–0.08) to write and upload on Replicate,
 * against a forward pass of 3 s, and what comes back here is 5 bytes per pixel. The dot grid is
 * coarser than this anyway (a 60 mm photo at 0.03 mm is 2000 dots and is sampled by position), and
 * the photo on the canvas keeps its full size. flux-id enforces the same cap for other clients.
 */
export const MAX_PHOTO_TO_3D_SIDE = 1536;

/**
 * The photo as a PNG no larger than `maxSide` on its longest side (alpha kept); the blob itself when
 * it already fits.
 */
export const downscalePhoto = async (blob: Blob, maxSide = MAX_PHOTO_TO_3D_SIDE): Promise<Blob> => {
  const bitmap = await createImageBitmap(blob);

  try {
    const scale = maxSide / Math.max(bitmap.width, bitmap.height);

    if (!(scale < 1)) return blob;

    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext('2d');

    if (!context) throw new Error('Unable to resize the photo');

    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

    if (!png) throw new Error('Unable to resize the photo');

    return png;
  } finally {
    bitmap.close();
  }
};
