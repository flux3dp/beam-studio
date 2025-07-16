import { match, P } from 'ts-pattern';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import { getRotationAngle, setRotationAngle } from '@core/app/svgedit/transform/rotation';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import updateElementColor from './color/updateElementColor';
import { finalizeImageCreation, getTransformedCoordinates, rasterizeGenericSvgElement } from './convertToImage.util';
import { getSVGAsync } from './svg-editor-helper';

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
type ConvertToImageResult = undefined | { imageElements: SVGImageElement[]; svgElements: SVGGElement[] };

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

  const imageElement = svgCanvas.addSvgElementFromJson({
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

  setRotationAngle(imageElement, angle, { parentCmd });
  svgCanvas.setHref(imageElement, imageSrc);
  updateElementColor(imageElement);
  finalizeImageCreation(imageElement, isToSelect, parentCmd);

  if (isToSelect) parentCmd.addSubCommand(deleteElements([svgElement], true));

  return { imageElements: [imageElement], svgElements: [svgElement] };
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
  const newImages = [];
  const svgElements = [];

  for await (const child of Array.from(svgElement.children)) {
    const result = await mainConverter({
      isToSelect: false,
      parentCmd,
      svgElement: child as SVGGElement,
    });

    if (result) {
      newImages.push(...result.imageElements);
      svgElements.push(...result.svgElements);
    }
  }

  // Group the newly created images
  if (newImages.length > 0) {
    svgCanvas.selectOnly(newImages);

    const groupCommand = svgCanvas.groupSelectedElements(true);

    if (groupCommand) {
      parentCmd.addSubCommand(groupCommand);
    }
  }

  return {
    imageElements: newImages,
    svgElements,
  }; // Return the images and SVG elements created from the group
};

/**
 * Main entry point for converting any supported SVG element to an image.
 */
export const convertSvgToImage: MainConverterFunc = async ({
  isToSelect = true,
  parentCmd = new history.BatchCommand('Convert SVG to Image'),
  svgElement,
}) => {
  // console.log(svgElement.cloneNode(true), 'convertSvgToImage', svgElement.tagName);

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

  if (isToSelect) {
    undoManager.addCommandToHistory(parentCmd);
    parentCmd.addSubCommand(deleteElements(result!.svgElements, true));
  }

  return result;
};
