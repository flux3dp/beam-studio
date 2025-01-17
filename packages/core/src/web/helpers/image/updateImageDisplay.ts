import imageData from 'helpers/image-data';
import NS from 'app/constants/namespaces';
import { getObjectLayer } from 'helpers/layer/layer-helper';
import { IImageDataResult } from 'interfaces/IImage';

// TODO: add test
const updateImageDisplay = (elem: SVGImageElement): Promise<void> => {
  const imgUrl = elem.getAttribute('origImage');
  if (!imgUrl) return Promise.resolve();
  const layer = getObjectLayer(elem)?.elem;
  let isFullColor = false;
  if (layer) {
    isFullColor = layer.getAttribute('data-fullcolor') === '1';
    if (isFullColor) elem.setAttribute('data-fullcolor', '1');
    else elem.removeAttribute('data-fullcolor');
  } else isFullColor = elem.getAttribute('data-fullcolor') === '1';
  const displayingFullColor = elem.getAttribute('display-fullcolor') === '1';
  if (
    elem.getAttributeNS(NS.XLINK, 'xlink:href') &&
    ((isFullColor && displayingFullColor) || (!isFullColor && !displayingFullColor))
  )
    return Promise.resolve();
  const isShading = elem.getAttribute('data-shading') === 'true';
  const threshold = parseInt(elem.getAttribute('data-threshold') || '128', 10);
  return new Promise<void>((resolve) => {
    imageData(imgUrl, {
      width: parseFloat(elem.getAttribute('width')),
      height: parseFloat(elem.getAttribute('height')),
      grayscale: isFullColor
        ? undefined
        : {
            is_rgba: true,
            is_shading: isShading,
            threshold,
            is_svg: false,
          },
      onComplete: (result: IImageDataResult) => {
        elem.setAttributeNS(NS.XLINK, 'xlink:href', result.pngBase64);
        // using this image to avoid redundant update
        if (isFullColor) elem.setAttribute('display-fullcolor', '1');
        else elem.removeAttribute('display-fullcolor');
        resolve();
      },
    });
  });
};

export default updateImageDisplay;
