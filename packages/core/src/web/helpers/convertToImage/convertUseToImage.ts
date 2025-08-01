import history from '@core/app/svgedit/history/history';
import { getRotationAngle } from '@core/app/svgedit/transform/rotation';

import { createAndFinalizeImage } from './createAndFinalizeImage';
import type { ConvertSvgToImageParams, ConvertToImageResult } from './types';

/**
 * Converts a <use> element to a sharp <image> by respecting the
 * source's natural dimensions and using transforms for scaling and positioning.
 */
export const convertUseToImage = async ({
  isToSelect = true,
  parentCmd = new history.BatchCommand('Convert Use to Image'),
  svgElement,
}: ConvertSvgToImageParams): Promise<ConvertToImageResult> => {
  const xlink = svgElement.getAttribute('xlink:href');
  const symbol = xlink ? document.querySelector(xlink) : null;
  const href = symbol?.children[0]?.getAttribute('href');

  if (!href) {
    console.warn('The <use> element does not reference a valid image source.');

    return undefined;
  }

  // 1. Load the blob URL into an in-memory image to get its true dimensions.
  const naturalSize = await new Promise<{ height: number; width: number }>((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve({ height: img.naturalHeight, width: img.naturalWidth });
    img.onerror = () => reject(new Error('Failed to load image from blob URL.'));
    img.src = href;
  });

  // 2. The new <image> will have the natural dimensions of the source.
  // All positioning and scaling is handled by the transform attribute.
  const dataXform = svgElement.getAttribute('data-xform');
  const [formX, formY, width, height] = dataXform?.split(' ')?.map((v) => Number.parseFloat(v.split('=')[1])) || [0, 0];
  const x = Number.parseFloat(svgElement.getAttribute('x') || '0') + formX;
  const y = Number.parseFloat(svgElement.getAttribute('y') || '0') + formY;
  const transform = svgElement.getAttribute('transform') || '';
  const dimensions = { height: naturalSize.height, width: naturalSize.width, x, y };

  return await createAndFinalizeImage(
    { angle: getRotationAngle(svgElement), attributes: { height, width }, dimensions, href, transform },
    { isToSelect, parentCmd, svgElement },
  );
};
