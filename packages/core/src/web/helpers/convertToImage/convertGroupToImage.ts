import history from '@core/app/svgedit/history/history';
import { getRotationAngle, setRotationAngle } from '@core/app/svgedit/transform/rotation';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getSVGAsync } from '../svg-editor-helper';

import type { ConvertSvgToImageParams, ConvertToImageResult } from './types';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const convertibleSvgTags = [
  'rect',
  'circle',
  'ellipse',
  'line',
  'polygon',
  'polyline',
  'path',
  'text',
  'use',
  'g',
] as const;

type MainConverterFunc = (params: ConvertSvgToImageParams) => Promise<ConvertToImageResult>;

/**
 * Recursively converts elements inside a <g> group to images.
 * @param params - The standard conversion parameters.
 * @param mainConverter - The main `convertSvgToImage` function, injected as a dependency.
 */
export const convertGroupToImage = async (
  { parentCmd = new history.BatchCommand('Convert Group to Image'), svgElement }: ConvertSvgToImageParams,
  mainConverter: MainConverterFunc,
): Promise<ConvertToImageResult> => {
  const angle = getRotationAngle(svgElement);
  const children = [...Array.from(svgElement.children)];
  const imageElements = [];
  const svgElements = [];

  if (svgElement.getAttribute('data-tempgroup') === 'true') {
    svgCanvas.ungroupTempGroup(svgElement);
  }

  for await (const child of children) {
    const result = await mainConverter({ isToSelect: false, parentCmd, svgElement: child as SVGGElement });

    if (result) {
      imageElements.push(...result.imageElements);
      svgElements.push(...result.svgElements);
    }
  }

  // Group the newly created images
  if (imageElements.length > 0) {
    svgCanvas.selectOnly(imageElements);

    const groupResult = svgCanvas.groupSelectedElements(true);

    if (groupResult) {
      parentCmd.addSubCommand(groupResult.command);

      if (angle) setRotationAngle(groupResult.group, angle, { parentCmd });

      imageElements.length = 0;
      imageElements.push(groupResult.group as any);
    }
  }

  return { imageElements, svgElements };
};
