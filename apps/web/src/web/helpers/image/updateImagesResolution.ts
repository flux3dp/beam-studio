import beamboxPreference from 'app/actions/beambox/beambox-preference';
import imageData from 'helpers/image-data';
import NS from 'app/constants/namespaces';
import { IImageDataResult } from 'interfaces/IImage';

/**
 * updateImagesResolution update all images resolution for exporting or light weight display
 * @param fullResolution target resolution: full resolution if true, otherwise low resolution
 */
const updateImagesResolution = async (
  fullResolution: boolean,
  parent?: Element
): Promise<void> => {
  if (beamboxPreference.read('image_downsampling') === false) return;
  const svgcontent = document.getElementById('svgcontent');
  const images = parent ? parent.querySelectorAll('image') : svgcontent?.querySelectorAll('image');
  if (!images) return;
  const promises = Array.from(images).map((image) => {
    const origImage = image.getAttribute('origImage');
    if (!origImage) return Promise.resolve();
    const isFullColor = image.getAttribute('data-fullcolor') === '1';
    const isShading = image.getAttribute('data-shading') === 'true';
    const threshold = parseInt(image.getAttribute('data-threshold') || '128', 10);
    return new Promise<void>((resolve) => {
      imageData(origImage, {
        grayscale: isFullColor
          ? undefined
          : {
              is_rgba: true,
              is_shading: isShading,
              threshold,
              is_svg: false,
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
