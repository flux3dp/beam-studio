import { laserModules } from '@core/app/constants/layer-module/layer-modules';
import NS from '@core/app/constants/namespaces';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { withMemoryLog } from '@core/helpers/debug/memoryLog';
import imageData from '@core/helpers/image-data';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getAllLayers } from '@core/helpers/layer/layer-helper';
import type { IImageDataResult } from '@core/interfaces/IImage';

import updateImageDisplay from './updateImageDisplay';

/**
 * updateImagesResolution update all images resolution for exporting
 * @returns a function to revert the changes
 */
const updateImagesResolution = async (): Promise<() => void> => {
  const allLayers = getAllLayers();
  const promises: Array<Promise<void>> = [];
  const changedImages: SVGImageElement[] = [];

  allLayers.forEach((layer) => {
    const layerModule = getData(layer, 'module');

    if (laserModules.has(layerModule!)) {
      const dpi = getData(layer, 'dpi') || 'medium';

      if (!['detailed', 'high', 'ultra'].includes(dpi)) return;
    }

    const images = Array.from(layer.querySelectorAll('image'));

    images.forEach((image) => {
      const origImage = image.getAttribute('origImage');

      if (!origImage) return;

      const isFullColor = image.getAttribute('data-fullcolor') === '1';
      const isShading = image.getAttribute('data-shading') === 'true';
      const threshold = Number.parseInt(image.getAttribute('data-threshold') || '128', 10);

      changedImages.push(image as SVGImageElement);
      promises.push(
        new Promise<void>((resolve) => {
          imageData(origImage, {
            grayscale: isFullColor
              ? undefined
              : {
                  is_rgba: true,
                  is_shading: isShading,
                  is_svg: false,
                  threshold,
                },
            isFullResolution: true,
            onComplete: (result: IImageDataResult) => {
              image.setAttributeNS(NS.XLINK, 'xlink:href', result.pngBase64);
              resolve();
            },
          });
        }),
      );
    });
  });

  // decodes every image at full resolution — the single largest allocation of the export path
  await withMemoryLog(`updateImagesResolution (${promises.length} images)`, () => Promise.all(promises));

  // force: the href these images carry is the full-resolution one written above, which
  // updateImageDisplay's own guard cannot distinguish from an up-to-date display href — without it
  // the revert silently does nothing and every image keeps its export-sized base64 for the rest of
  // the session
  return () =>
    withMemoryLog('updateImagesResolution: revert', () =>
      Promise.all(changedImages.map((image) => updateImageDisplay(image, { force: true }))),
    );
};

// Runs when the downsampling preference changes, i.e. exactly when every image needs redrawing at
// a different resolution — force, or the guard sees an href already in place and skips them all.
const updateAllImageResolution = () => {
  const images = Array.from(document.getElementById('svgcontent')?.querySelectorAll('image') ?? []);

  images.forEach((image) => {
    updateImageDisplay(image as SVGImageElement, { force: true, useNativeSize: true });
  });
};

useGlobalPreferenceStore.subscribe((state) => state.image_downsampling, updateAllImageResolution);

export default updateImagesResolution;
