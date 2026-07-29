import NS from '@core/app/constants/namespaces';

/**
 * Layer color is applied to <image> via a color filter over a mono-processed
 * display bitmap (the untouched original is kept in the `origImage` attribute),
 * and to <use> by rendering a tinted bitmap symbol. For the print preview and
 * the exported pdf we want the artwork's original look instead.
 */

const blobUrlToDataUrl = async (url: string): Promise<string> => {
  const blob = await (await fetch(url)).blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Map image element id → original image as data url, for contexts where blob
 * urls cannot load (an svg string rendered through an <img> element).
 */
export const getOriginalImageHrefs = async (): Promise<Map<string, string>> => {
  const result = new Map<string, string>();
  const images = [...document.querySelectorAll('#svgcontent g.layer image')] as SVGImageElement[];

  await Promise.all(
    images.map(async (image) => {
      const origImage = image.getAttribute('origImage');

      if (!origImage || !image.id) return;

      try {
        result.set(image.id, origImage.startsWith('data:') ? origImage : await blobUrlToDataUrl(origImage));
      } catch {
        // keep the displayed bitmap when the original cannot be read
      }
    }),
  );

  return result;
};

/**
 * Restore original colors inside a cloned subtree (layers or defs):
 * - remove the layer color filter from images
 * - swap the mono display bitmap back to the original image (`imageHrefs` for
 *   pdf export, the `origImage` attribute directly for the in-document preview)
 * - point uses at their vector origin symbol instead of the tinted bitmap symbol
 */
export const restoreOriginalColors = (root: Element, imageHrefs?: Map<string, string>): void => {
  root.querySelectorAll('image').forEach((image) => {
    image.removeAttribute('filter');

    const original = imageHrefs ? imageHrefs.get(image.id) : image.getAttribute('origImage');

    if (original) image.setAttributeNS(NS.XLINK, 'xlink:href', original);
  });

  root.querySelectorAll('use').forEach((use) => {
    const href = use.getAttribute('xlink:href') || use.getAttribute('href');

    if (!href) return;

    const symbol = root.querySelector(href) ?? document.querySelector(href);
    const originId = symbol?.getAttribute('data-origin-symbol');

    if (originId) use.setAttribute('xlink:href', `#${originId}`);
  });
};
