import history from '@core/app/svgedit/history/history';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import { setRotationAngle } from '@core/app/svgedit/transform/rotation';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import updateElementColor from '../color/updateElementColor';
import { getSVGAsync } from '../svg-editor-helper';

import type { ConvertSvgToImageParams, ConvertToImageResult, CreateImageParams } from './types';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

/**
 * A helper to add the newly created <image> element to the canvas and handle history.
 * This removes repetitive code from each conversion function.
 */
const finalizeImageCreation = (imageElement: SVGImageElement, isToSelect: boolean, parentCmd: IBatchCommand) => {
  const cmd = new history.InsertElementCommand(imageElement);

  parentCmd.addSubCommand(cmd);

  if (isToSelect) {
    svgCanvas.selectOnly([imageElement]);
  }
};

/**
 * Creates the <image> element on the canvas and finalizes the operation.
 * This encapsulates all the common steps like setting attributes, color, rotation, and history.
 */
export const createAndFinalizeImage = async (
  { angle = 0, height, href, transform, width, x, y }: CreateImageParams,
  { isToSelect, parentCmd, svgElement }: Required<ConvertSvgToImageParams>,
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

  setRotationAngle(imageElement, angle, { parentCmd });
  svgCanvas.setHref(imageElement, href);
  updateElementColor(imageElement);
  finalizeImageCreation(imageElement, isToSelect, parentCmd);

  if (isToSelect) parentCmd.addSubCommand(deleteElements([svgElement], true));

  return { imageElements: [imageElement], svgElements: [svgElement] };
};
