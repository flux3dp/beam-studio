import { match, P } from 'ts-pattern';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import updateElementColor from './color/updateElementColor';
import { finalizeImageCreation, getTransformedCoordinates, rasterizeGenericSvgElement } from './convertToImage.util';
import { getSVGAsync } from './svg-editor-helper';

// (The types, constants, and getSVGAsync setup remain the same as your original code)
let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export type ConvertSvgToImageParams = {
  isToSelect?: boolean;
  parentCmd?: IBatchCommand;
  scale?: number;
  svgElement: SVGGElement;
};
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

/**
 * Converts a <use> element to an <image>. Its logic is unique and doesn't involve rasterization.
 * Refactored to use the `finalizeImageCreation` helper.
 */
async function convertUseToImage({
  isToSelect = true,
  parentCmd = new history.BatchCommand('Convert Use to Image'),
  svgElement,
}: ConvertSvgToImageParams): Promise<SVGImageElement | undefined> {
  const href = svgElement.getAttribute('xlink:href');
  const symbol = href ? document.querySelector(href) : null;
  const imageSrc = symbol?.children[0]?.getAttribute('href');

  if (!imageSrc) {
    console.warn('The <use> element does not reference a valid image source.');

    return undefined;
  }

  const x = Number.parseFloat(svgElement.getAttribute('x') || '0');
  const y = Number.parseFloat(svgElement.getAttribute('y') || '0');
  const dataXform = svgElement.getAttribute('data-xform');
  const [w, h] = dataXform
    ? dataXform
        .split(' ')
        .slice(2, 4)
        .map((v) => Number.parseFloat(v.split('=')[1]))
    : [0, 0];
  const {
    height,
    width,
    x: newX,
    y: newY,
  } = getTransformedCoordinates({ height: h, width: w, x, y }, svgElement.getAttribute('transform'));

  const newImage = svgCanvas.addSvgElementFromJson({
    attr: {
      'data-ratiofixed': true,
      'data-shading': true,
      'data-threshold': 254,
      height,
      id: svgCanvas.getNextId(),
      origImage: imageSrc,
      preserveAspectRatio: 'none',
      style: 'pointer-events:inherit',
      width,
      x: newX,
      y: newY,
    },
    element: 'image',
  }) as SVGImageElement;

  svgCanvas.setHref(newImage, imageSrc);
  updateElementColor(newImage);
  finalizeImageCreation(newImage, isToSelect, parentCmd);

  return newImage as SVGImageElement;
}

/**
 * Recursively converts all elements inside a <g> group to images.
 * Refactored to call the main `convertSvgToImage` dispatcher.
 */
async function convertGroupToImage({
  parentCmd = new history.BatchCommand('Convert Group to Image'),
  svgElement,
}: ConvertSvgToImageParams): Promise<undefined> {
  const groupBatchCmd = new history.BatchCommand('Convert Group to Image');
  const newImages = [];

  for (const child of Array.from(svgElement.children)) {
    const image = await convertSvgToImage({
      isToSelect: false,
      parentCmd: groupBatchCmd,
      svgElement: child as SVGGElement,
    });

    if (image) newImages.push(image);
  }

  // Group the newly created images
  if (newImages.length > 0) {
    svgCanvas.selectOnly(newImages);

    const groupCommand = svgCanvas.groupSelectedElements(true);

    parentCmd.addSubCommand(groupCommand || groupBatchCmd);
  }

  return undefined; // Groups don't return a single image
}

/**
 * Main entry point for converting any supported SVG element to an image.
 * This function now acts as a dispatcher, using `ts-pattern` for clean matching.
 */
export const convertSvgToImage = async ({
  isToSelect = true,
  parentCmd = new history.BatchCommand('Convert SVG to Image'),
  svgElement,
}: ConvertSvgToImageParams): Promise<SVGImageElement | undefined> => {
  const result = await match(svgElement)
    .with({ tagName: 'use' }, async (svgElement) => convertUseToImage({ isToSelect, parentCmd, svgElement }))
    .when(
      // skip border elements(e.g., multi-selection border for use elements)
      (svgElement) => svgElement.getAttribute('data-imageborder') === 'true',
      async () => Promise.resolve(undefined),
    )
    .when(
      // match text-on-path elements before group elements, due to their tagName are the same
      (svgElement) => svgElement.getAttribute('data-textpath-g') === '1',
      async (svgElement) => rasterizeGenericSvgElement({ isToSelect, parentCmd, svgElement }),
    )
    .with({ tagName: 'g' }, async (svgElement) => convertGroupToImage({ isToSelect, parentCmd, svgElement }))
    .with({ tagName: P.union(...convertibleSvgTags) }, async (svgElement) =>
      rasterizeGenericSvgElement({ isToSelect, parentCmd, svgElement }),
    )
    .otherwise(async ({ tagName }) => {
      console.log('The provided SVG element is not convertible:', tagName);

      return Promise.resolve(undefined);
    });

  undoManager.addCommandToHistory(parentCmd);

  return result;
};
