import { match, P } from 'ts-pattern';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import { getRotationAngle, setRotationAngle } from '@core/app/svgedit/transform/rotation';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import type { ConvertSvgToImageParams, ConvertToImageResult } from './convertToImage.util';
import { createAndFinalizeImage, rasterizeGenericSvgElement } from './convertToImage.util';
import { getSVGAsync } from './svg-editor-helper';

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
 * Converts a <use> element to an <image>. Its logic is unique and doesn't involve rasterization.
 * Refactored to use the `finalizeImageCreation` helper.
 */
const convertUseToImage = async ({
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

/**
 * Recursively converts elements inside a <g> group to images.
 * @param params - The standard conversion parameters.
 * @param mainConverter - The main `convertSvgToImage` function, injected as a dependency.
 */
const convertGroupToImage = async (
  { parentCmd = new history.BatchCommand('Convert Group to Image'), svgElement }: ConvertSvgToImageParams,
  mainConverter: MainConverterFunc,
): Promise<ConvertToImageResult> => {
  const angle = getRotationAngle(svgElement);
  const imageElements = [];
  const svgElements = [];

  for await (const child of Array.from(svgElement.children)) {
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

/**
 * Main entry point for converting any supported SVG element to an image.
 */
export const convertSvgToImage: MainConverterFunc = async ({
  isToSelect = true,
  parentCmd = new history.BatchCommand('Convert SVG to Image'),
  svgElement,
}) => {
  if (!svgElement || svgElement.getAttribute('data-imageborder') === 'true') {
    return undefined;
  }

  const result = await match(svgElement)
    .with({ tagName: 'use' }, async (el) => convertUseToImage({ isToSelect, parentCmd, svgElement: el }))
    .when(
      (el) => el.getAttribute('data-textpath-g') === '1',
      async (el) => rasterizeGenericSvgElement({ isToSelect, parentCmd, svgElement: el }),
    )
    .with({ tagName: 'g' }, async (el) =>
      convertGroupToImage({ isToSelect, parentCmd, svgElement: el }, convertSvgToImage),
    )
    .with({ tagName: P.union(...convertibleSvgTags) }, async (el) =>
      rasterizeGenericSvgElement({ isToSelect, parentCmd, svgElement: el }),
    )
    .otherwise(async ({ tagName }) => {
      console.log('The provided SVG element is not convertible:', tagName);

      return Promise.resolve(undefined);
    });

  if (isToSelect && result) {
    undoManager.addCommandToHistory(parentCmd);
    parentCmd.addSubCommand(deleteElements(result.svgElements, true));
  }

  return result;
};
