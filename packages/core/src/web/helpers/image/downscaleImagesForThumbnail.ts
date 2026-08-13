import PQueue from 'p-queue';

import NS from '@core/app/constants/namespaces';

/**
 * Longest edge any image keeps while a thumbnail is rasterised.
 *
 * Thumbnails top out at 500px, so a single image cannot usefully contribute more than that even if
 * it fills the whole frame. 1000 leaves a comfortable margin and still discards most of the pixels
 * of a photo-sized source.
 */
const MAX_EDGE = 1000;

/** Matches the ceiling used elsewhere for full-resolution work. */
const CONCURRENCY = 4;

const getHref = (image: SVGImageElement): null | string =>
  image.getAttributeNS(NS.XLINK, 'href') || image.getAttribute('href') || image.getAttribute('xlink:href');

const downscaleOne = async (image: SVGImageElement): Promise<void> => {
  const href = getHref(image);

  if (!href) return;

  const img = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('failed to load'));
      img.src = href;
    });

    const longEdge = Math.max(img.naturalWidth, img.naturalHeight);

    if (longEdge <= MAX_EDGE) return;

    const ratio = MAX_EDGE / longEdge;
    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    image.setAttributeNS(NS.XLINK, 'xlink:href', canvas.toDataURL('image/png'));
  } catch {
    // keep the original href: a thumbnail that costs too much memory still beats a blank one
    console.warn(`Failed to downscale ${image.id} for the thumbnail, using it as-is`);
  } finally {
    // let the decoded bitmap go before the next image is loaded
    img.src = '';
  }
};

/**
 * Shrink the images of a detached SVG tree to the size a thumbnail can actually show.
 *
 * Rasterising a scene by handing its SVG to an <img> makes the browser decode every embedded image
 * at the size it was stored at, simultaneously, for one paint — on an image-heavy document that is
 * gigabytes of bitmap for a picture a few hundred pixels wide. Rewriting the hrefs first caps the
 * cost at whatever the thumbnail can resolve, and doing it a few at a time means the peak does not
 * scale with the number of images.
 *
 * The roots must be clones. These hrefs are replaced in place, and doing that to the live canvas
 * would replace what the user is editing with a thumbnail-sized copy.
 */
export const downscaleImagesForThumbnail = async (...roots: Element[]): Promise<void> => {
  const images = roots.flatMap((root) => Array.from(root.querySelectorAll('image')));

  if (!images.length) return;

  await new PQueue({ concurrency: CONCURRENCY }).addAll(images.map((image) => () => downscaleOne(image)));
};

export default downscaleImagesForThumbnail;
