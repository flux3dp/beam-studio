import NS from '@core/app/constants/namespaces';
import history from '@core/app/svgedit/history/history';

import { createAndFinalizeImage } from './createAndFinalizeImage';
import type { ConvertSvgToImageParams, ConvertToImageResult } from './types';

/**
 * Converts a <use> element to a sharp <image> by respecting the
 * source's dimensions and using transforms for scaling and positioning.
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

  const dataXform = svgElement.getAttribute('data-xform');
  const [formX = 0, formY = 0, width = 0, height = 0] =
    dataXform?.split(' ').map((v) => Number.parseFloat(v.split('=')[1])) || [];
  const dimensions = {
    height,
    width,
    x: Number.parseFloat(svgElement.getAttribute('x') || '0') + formX,
    y: Number.parseFloat(svgElement.getAttribute('y') || '0') + formY,
  };

  // Separate the rotation from all other transforms.
  let angle = 0;
  const otherTransforms: SVGMatrix[] = [];
  const transforms = svgElement.transform.baseVal;

  for (let i = 0; i < transforms.numberOfItems; i++) {
    const t = transforms.getItem(i);

    if (t.type === SVGTransform.SVG_TRANSFORM_ROTATE) {
      angle = t.angle;
    } else {
      otherTransforms.push(t.matrix);
    }
  }

  // Rebuild a single matrix from all non-rotation transforms.
  const svg = document.createElementNS(NS.SVG, 'svg');
  const combinedMatrix = otherTransforms.reduce((acc, matrix) => acc.multiply(matrix), svg.createSVGMatrix());
  let transformString = '';

  // Check if the matrix is not the identity matrix to avoid adding an unnecessary transform.
  if (!combinedMatrix.isIdentity) {
    const { a, b, c, d, e, f } = combinedMatrix;

    transformString = `matrix(${a},${b},${c},${d},${e},${f})`;
  }

  // Create the new image, applying the separated components.
  return await createAndFinalizeImage(
    { angle, dimensions, href, transform: transformString },
    { isToSelect, parentCmd, svgElement },
  );
};
