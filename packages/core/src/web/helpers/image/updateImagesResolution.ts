import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import { printingModules } from '@core/app/constants/layer-module/layer-modules';
import NS from '@core/app/constants/namespaces';
import imageData from '@core/helpers/image-data';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getAllLayers } from '@core/helpers/layer/layer-helper';
import type { IImageDataResult } from '@core/interfaces/IImage';

/**
 * updateImagesResolution update all images resolution for exporting or light weight display
 * @param fullResolution target resolution: full resolution if true, otherwise low resolution
 */
const updateImagesResolution = async (): Promise<void> => {
  const allLayers = getAllLayers();
  const isImagesDownSamplingEnabled = beamboxPreference.read('image_downsampling');
  const engraveDpi = beamboxPreference.read('engrave_dpi');
  const isHighResolution = engraveDpi === 'high' || engraveDpi === 'ultra';

  const promises: Array<Promise<void>> = [];

  allLayers.forEach((layer) => {
    const layerModule = getData(layer, 'module');

    if (!(printingModules.has(layerModule!) || isImagesDownSamplingEnabled || isHighResolution)) {
      return;
    }

    const images = Array.from(layer.querySelectorAll('image'));

    images.forEach((image) => {
      const origImage = image.getAttribute('origImage');

      if (!origImage) return;

      const isFullColor = image.getAttribute('data-fullcolor') === '1';
      const isShading = image.getAttribute('data-shading') === 'true';
      const threshold = Number.parseInt(image.getAttribute('data-threshold') || '128', 10);

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

  await Promise.all(promises);
};

export default updateImagesResolution;
