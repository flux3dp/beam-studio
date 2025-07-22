import history from '@core/app/svgedit/history/history';
import { getRotationAngle } from '@core/app/svgedit/transform/rotation';

import { createAndFinalizeImage } from './createAndFinalizeImage';
import type { ConvertSvgToImageParams, ConvertToImageResult } from './types';

/**
 * Converts a <use> element to an <image>. Its logic is unique and doesn't involve rasterization.
 * Refactored to use the `finalizeImageCreation` helper.
 */
export const convertUseToImage = async ({
  isToSelect = true,
  parentCmd = new history.BatchCommand('Convert Use to Image'),
  svgElement,
}: ConvertSvgToImageParams): Promise<ConvertToImageResult> => {
  const angle = getRotationAngle(svgElement);
  const href = svgElement.getAttribute('xlink:href');
  const symbol = href ? document.querySelector(href) : null;
  const imageSrc = symbol?.children[0]?.getAttribute('href');

  if (!imageSrc) {
    console.warn('The <use> element does not reference a valid image source.');

    return undefined;
  }

  const dataXform = svgElement.getAttribute('data-xform');
  const [formX, formY, width, height] = dataXform?.split(' ')?.map((v) => Number.parseFloat(v.split('=')[1])) || [0, 0];
  const x = Number.parseFloat(svgElement.getAttribute('x') || '0') + formX;
  const y = Number.parseFloat(svgElement.getAttribute('y') || '0') + formY;
  const transform = svgElement.getAttribute('transform') || '';

  return createAndFinalizeImage(
    { angle, height, href: imageSrc, transform, width, x, y },
    { isToSelect, parentCmd, svgElement },
  );
};
