import NS from '@core/app/constants/namespaces';
import imageData from '@core/helpers/image-data';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import type { IImageDataResult } from '@core/interfaces/IImage';

// TODO: add test
const updateImageDisplay = (
  elem: SVGImageElement,
  { useNativeSize = false }: { useNativeSize?: boolean } = {},
): Promise<void> => {
  const imgUrl = elem.getAttribute('origImage');

  if (!imgUrl) {
    return Promise.resolve();
  }

  const layer = getObjectLayer(elem)?.elem;
  let isFullColor = false;

  if (layer) {
    isFullColor = layer.getAttribute('data-fullcolor') === '1';

    if (isFullColor) {
      elem.setAttribute('data-fullcolor', '1');
    } else {
      elem.removeAttribute('data-fullcolor');
    }
  } else {
    isFullColor = elem.getAttribute('data-fullcolor') === '1';
  }

  const displayingFullColor = elem.getAttribute('display-fullcolor') === '1';

  if (
    elem.getAttributeNS(NS.XLINK, 'xlink:href') &&
    ((isFullColor && displayingFullColor) || (!isFullColor && !displayingFullColor))
  ) {
    return Promise.resolve();
  }

  const isShading = elem.getAttribute('data-shading') === 'true';
  const threshold = Number.parseInt(elem.getAttribute('data-threshold') || '128', 10);

  return new Promise<void>((resolve) => {
    imageData(imgUrl, {
      grayscale: isFullColor
        ? undefined
        : {
            is_rgba: true,
            is_shading: isShading,
            is_svg: false,
            threshold,
          },
      height: useNativeSize ? undefined : Number.parseFloat(elem.getAttribute('height') ?? '0'),
      onComplete: (result: IImageDataResult) => {
        elem.setAttributeNS(NS.XLINK, 'xlink:href', result.pngBase64);

        // using this image to avoid redundant update
        if (isFullColor) {
          elem.setAttribute('display-fullcolor', '1');
        } else {
          elem.removeAttribute('display-fullcolor');
        }

        resolve();
      },
      width: useNativeSize ? undefined : Number.parseFloat(elem.getAttribute('width') ?? '0'),
    });
  });
};

export default updateImageDisplay;
