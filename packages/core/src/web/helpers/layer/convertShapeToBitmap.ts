/**
 * Convert shape to bitmap for printing
 * using for single-color printing layer only
 */
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import NS from '@core/app/constants/namespaces';
import updateImageDisplay from '@core/helpers/image/updateImageDisplay';

import { getData } from './layer-config-helper';
import { getAllLayerNames, getLayerElementByName } from './layer-helper';
import layerToImage from './layerToImage';

/**
 * convertShapeToBitmap
 * drawing shapes into bitmap and then remove them
 * only keep image related elements inside svg
 * @returns
 */
const convertShapeToBitmap = async (): Promise<() => void> => {
  const allLayerNames = getAllLayerNames();
  const promises = [];
  const newImages: SVGImageElement[] = [];
  const elementsToKeep: Array<{ elem: Element; nextSibling: Node | null; parentNode: Node | null }> = [];
  // clean element unrelated to image
  const selector = ['g', 'image', 'title', 'filter', 'clipPath', 'clipPath > *']
    .map((tagName) => `:not(${tagName})`)
    .join('');

  for (let i = 0; i < allLayerNames.length; i += 1) {
    const layerName = allLayerNames[i];
    const layer = getLayerElementByName(layerName);

    if (!getData(layer, 'fullcolor') && printingModules.has(getData(layer, 'module'))) {
      // eslint-disable-next-line no-async-promise-executor
      const promise = new Promise<void>(async (resolve) => {
        const { bbox, rgbBlob: blob } = await layerToImage(layer as SVGGElement, {
          shapesOnly: true,
        });

        Array.from(layer.querySelectorAll(`*${selector}`))
          .reverse()
          .forEach((elem) => {
            const { nextSibling, parentNode } = elem;

            elementsToKeep.push({ elem, nextSibling, parentNode });
            elem.remove();
          });

        if (!blob || bbox.width === 0 || bbox.height === 0) {
          resolve();

          return;
        }

        const newImgUrl = URL.createObjectURL(blob);
        const newImage = document.createElementNS(NS.SVG, 'image') as unknown as SVGImageElement;

        newImage.setAttribute('x', bbox.x.toString());
        newImage.setAttribute('y', bbox.y.toString());
        newImage.setAttribute('width', bbox.width.toString());
        newImage.setAttribute('height', bbox.height.toString());
        newImage.setAttribute('id', 'temp-image');
        newImage.setAttribute('style', 'pointer-events:inherit');
        newImage.setAttribute('preserveAspectRatio', 'none');
        newImage.setAttribute('origImage', newImgUrl);
        newImage.setAttribute('data-threshold', '128');
        newImage.setAttribute('data-shading', 'false');
        layer.appendChild(newImage);
        await updateImageDisplay(newImage);
        newImages.push(newImage);
        resolve();
      });

      promises.push(promise);
    }
  }
  await Promise.allSettled(promises);

  const revert = () => {
    newImages.forEach((image) => image.remove());
    elementsToKeep.forEach(({ elem, nextSibling, parentNode }) => {
      if (nextSibling) {
        parentNode!.insertBefore(elem, nextSibling);
      } else {
        parentNode!.appendChild(elem);
      }
    });
  };

  return revert;
};

export default convertShapeToBitmap;
