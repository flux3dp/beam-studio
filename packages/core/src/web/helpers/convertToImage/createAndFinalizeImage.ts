import history from '@core/app/svgedit/history/history';
import { setRotationAngle } from '@core/app/svgedit/transform/rotation';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import updateElementColor from '../color/updateElementColor';
import { getSVGAsync } from '../svg-editor-helper';

import type { ConvertSvgToImageParams, ConvertToImageResult, CreateImageParams } from './types';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

/**
 * Creates the <image> element on the canvas and finalizes the operation.
 * This encapsulates all the common steps like setting attributes, color, rotation, and history.
 */
export const createAndFinalizeImage = async (
  { angle = 0, height, href, transform, width, x, y }: CreateImageParams,
  { parentCmd, svgElement }: Required<ConvertSvgToImageParams>,
): Promise<ConvertToImageResult> => {
  const imageElement = svgCanvas.addSvgElementFromJson({
    attr: {
      'data-ratiofixed': true,
      'data-shading': true,
      'data-threshold': 254,
      height,
      id: svgCanvas.getNextId(),
      origImage: href,
      preserveAspectRatio: 'none',
      style: 'pointer-events:inherit',
      width,
      x,
      y,
    },
    element: 'image',
  }) as SVGImageElement;

  if (transform) imageElement.setAttribute('transform', transform);

  parentCmd.addSubCommand(new history.InsertElementCommand(imageElement));
  setRotationAngle(imageElement, angle, { parentCmd });
  svgCanvas.setHref(imageElement, href);
  updateElementColor(imageElement);

  return { imageElements: [imageElement], svgElements: [svgElement] };
};
