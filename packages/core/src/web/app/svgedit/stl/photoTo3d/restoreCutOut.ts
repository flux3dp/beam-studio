/**
 * The cut-out at the photo's own size: the photo's pixels under the cut-out's alpha. The server removes
 * the background from the downscaled photo it was sent (`downscalePhoto`), so the cut-out it returns is
 * small; the canvas and the dithering keep the full photo's detail by taking only its transparency.
 */
export const restoreCutOut = async (photo: Blob, cutOut: Blob): Promise<Blob> => {
  const [photoBitmap, cutOutBitmap] = await Promise.all([createImageBitmap(photo), createImageBitmap(cutOut)]);

  try {
    const canvas = document.createElement('canvas');

    canvas.width = photoBitmap.width;
    canvas.height = photoBitmap.height;

    const context = canvas.getContext('2d');

    if (!context) throw new Error('Unable to restore the cut-out');

    context.drawImage(photoBitmap, 0, 0);
    context.globalCompositeOperation = 'destination-in';
    context.imageSmoothingQuality = 'high';
    context.drawImage(cutOutBitmap, 0, 0, canvas.width, canvas.height);

    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

    if (!png) throw new Error('Unable to restore the cut-out');

    return png;
  } finally {
    photoBitmap.close();
    cutOutBitmap.close();
  }
};
