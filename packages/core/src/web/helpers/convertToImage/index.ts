import { match, P } from 'ts-pattern';

import ungroupElement from '@core/app/svgedit/group/ungroup';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getSVGAsync } from '../svg-editor-helper';

import { combineImagesIntoSingleElement } from './combineImagesIntoSingleElement';
import { convertGroupToImage } from './convertGroupToImage';
import { convertUseToImage } from './convertUseToImage';
import { rasterizeGenericSvgElement } from './rasterizeGenericSvgElement';
import type { MainConverterFunc } from './types';

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
    .with({ tagName: 'image' }, async (el) => ({ imageElements: [el as SVGImageElement], svgElements: [] }))
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
    const toSelect = [];

    if (result.svgElements.length > 0) {
      const origImageElement = result.imageElements[0] as SVGImageElement;
      const elements = [origImageElement];

      result.imageElements.length = 0;

      while (elements.length > 0) {
        const element = elements.pop() as SVGImageElement;

        if (element.tagName === 'g' && element.getAttribute('data-textpath-g') !== '1') {
          const { batchCmd, children } = ungroupElement(element);

          parentCmd.addSubCommand(batchCmd);

          elements.push(...(children as SVGImageElement[]));
        } else {
          toSelect.push(element);
          result.imageElements.push(element);
        }
      }
    }

    parentCmd.addSubCommand(deleteElements(result.svgElements, true));
    svgCanvas.selectOnly(toSelect);

    // Only combine if there's more than one image
    if (toSelect.length > 1) {
      // Wait for href transformation to complete from blob to base64
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const combinedImage = await combineImagesIntoSingleElement(toSelect as SVGImageElement[]);

      parentCmd.addSubCommand(new history.InsertElementCommand(combinedImage));
      parentCmd.addSubCommand(deleteElements(toSelect, true));
      svgCanvas.selectOnly([combinedImage]);
    }

    undoManager.addCommandToHistory(parentCmd);
  }

  return result;
};
