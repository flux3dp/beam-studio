import NS from '@core/app/constants/namespaces';
import history from '@core/app/svgedit/history/history';
import { getRotationAngle, setRotationAngle } from '@core/app/svgedit/transform/rotation';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getSVGAsync } from '../svg-editor-helper';

import type { ConvertSvgToImageParams, ConvertToImageResult, MainConverterFunc } from './types';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

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
  const otherTransforms: SVGMatrix[] = [];
  const transforms = svgElement.transform.baseVal;

  for (let i = 0; i < transforms.numberOfItems; i++) {
    const t = transforms.getItem(i);

    if (t.type !== SVGTransform.SVG_TRANSFORM_ROTATE) {
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

  // remove temporary group to prevent the element cannot be inserted during undo
  if (svgElement.getAttribute('data-tempgroup') === 'true') {
    svgCanvas.ungroupTempGroup(svgElement);
  }

  for await (const child of children) {
    const result = await mainConverter({ isToSelect: false, parentCmd, svgElement: child as SVGGElement });

    if (!result) continue;

    svgElements.push(...result.svgElements);
    imageElements.push(...result.imageElements);
  }

  // Group the newly created images
  if (imageElements.length > 0) {
    svgCanvas.selectOnly(imageElements);

    const groupResult = svgCanvas.groupSelectedElements(true);

    if (groupResult) {
      parentCmd.addSubCommand(groupResult.command);

      if (transformString) groupResult.group.setAttribute('transform', transformString);

      if (angle) setRotationAngle(groupResult.group, angle, { parentCmd });

      imageElements.length = 0;
      imageElements.push(groupResult.group as any);
    }
  }

  return { imageElements, svgElements };
};
