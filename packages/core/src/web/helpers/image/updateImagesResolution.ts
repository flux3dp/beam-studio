import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import NS from '@core/app/constants/namespaces';
import imageData from '@core/helpers/image-data';
import type { IImageDataResult } from '@core/interfaces/IImage';

/**
 * updateImagesResolution update all images resolution for exporting or light weight display
 * @param fullResolution target resolution: full resolution if true, otherwise low resolution
 */
const updateImagesResolution = async (fullResolution: boolean, parent?: Element): Promise<void> => {
  if (beamboxPreference.read('image_downsampling') === false) {
    return;
  }

  const svgcontent = document.getElementById('svgcontent');
  const images = parent ? parent.querySelectorAll('image') : svgcontent?.querySelectorAll('image');

  if (!images) {
    return;
  }

  const promises = Array.from(images).map((image) => {
    const origImage = image.getAttribute('origImage');

    if (!origImage) {
      return Promise.resolve();
    }

    const isFullColor = image.getAttribute('data-fullcolor') === '1';
    const isShading = image.getAttribute('data-shading') === 'true';
    const threshold = Number.parseInt(image.getAttribute('data-threshold') || '128', 10);

    return new Promise<void>((resolve) => {
      imageData(origImage, {
        grayscale: isFullColor
          ? undefined
          : {
              is_rgba: true,
              is_shading: isShading,
              is_svg: false,
              threshold,
            },
        isFullResolution: fullResolution,
        onComplete: (result: IImageDataResult) => {
          image.setAttributeNS(NS.XLINK, 'xlink:href', result.pngBase64);
          resolve();
        },
      });
    });
  });

  await Promise.all(promises);
};

export default updateImagesResolution;
