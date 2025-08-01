import { pipe } from 'remeda';
import { match, P } from 'ts-pattern';

import progressCaller from '@core/app/actions/progress-caller';
import ungroupElement from '@core/app/svgedit/group/ungroup';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import updateElementColor from '../color/updateElementColor';
import { convertTextOnPathToPath, convertTextToPath } from '../convertToPath';
import i18n from '../i18n';
import { sortLayerNamesByPosition } from '../layer/layer-helper';
import moveElementsToLayer from '../layer/moveToLayer';
import { getSVGAsync } from '../svg-editor-helper';

import { combineImagesIntoSingleElement } from './combineImagesIntoSingleElement';
import { convertGroupToImage } from './convertGroupToImage';
import { convertUseToImage } from './convertUseToImage';
import { getLayerTitles } from './getLayerTitles';
import { rasterizeGenericSvgElement } from './rasterizeGenericSvgElement';
import type { MainConverterFunc } from './types';
import { waitForHrefTransformation } from './waitForHrefTransformation';

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

  if (isToSelect) {
    progressCaller.openNonstopProgress({
      id: 'convert-svg-to-image',
      message: i18n.lang.beambox.photo_edit_panel.processing,
    });
  }

  const layer = pipe(svgElement, getLayerTitles, sortLayerNamesByPosition, (titles) => titles.at(-1));

  const result = await match(svgElement)
    .with({ tagName: 'use' }, async (el) => await convertUseToImage({ isToSelect, parentCmd, svgElement: el }))
    .with({ tagName: 'image' }, async (el) => ({ imageElements: [el as SVGImageElement], svgElements: [el] }))
    .when(
      (el) => el.getAttribute('data-textpath-g') === '1',
      async (el) => {
        const { group } = await convertTextOnPathToPath({ element: el, parentCommand: parentCmd });

        return await convertSvgToImage({ isToSelect: false, parentCmd, svgElement: group });
      },
    )
    .with(
      { tagName: 'g' },
      async (el) => await convertGroupToImage({ isToSelect, parentCmd, svgElement: el }, convertSvgToImage),
    )
    .with({ tagName: 'text' }, async (el) => {
      const { path } = await convertTextToPath({ element: el, isToSelect: false, parentCommand: parentCmd });

      return await convertSvgToImage({ isToSelect, parentCmd, svgElement: path! });
    })
    .with(
      { tagName: P.union(...convertibleSvgTags) },
      async (el) => await rasterizeGenericSvgElement({ isToSelect, parentCmd, svgElement: el }),
    )
    .otherwise(async ({ tagName }) => {
      console.log('The provided SVG element is not convertible:', tagName);

      return await Promise.resolve(undefined);
    });

  if (isToSelect && result) {
    if (result.svgElements.length > 0) {
      const elements = [...result.imageElements];

      result.imageElements.length = 0;

      while (elements.length > 0) {
        const element = elements.pop() as SVGImageElement;

        if (element.tagName === 'g' && element.getAttribute('data-textpath-g') !== '1') {
          const { batchCmd, children } = ungroupElement(element);

          parentCmd.addSubCommand(batchCmd);

          elements.push(...(children as SVGImageElement[]));
        } else {
          result.imageElements.push(element);
        }
      }
    }

    // Wait for href transformation to complete from blob to base64
    try {
      await waitForHrefTransformation(result.imageElements);
    } catch (error) {
      console.error('Error waiting for image loads:', error);
      progressCaller.popById('convert-svg-to-image');

      return undefined;
    }

    const combinedImage = await combineImagesIntoSingleElement(result.imageElements);

    parentCmd.addSubCommand(new history.InsertElementCommand(combinedImage));
    parentCmd.addSubCommand(deleteElements([...result.svgElements, ...result.imageElements], true));

    if (layer) {
      const moveCmd = moveElementsToLayer(layer, [combinedImage]);

      if (moveCmd) parentCmd.addSubCommand(moveCmd);
    }

    updateElementColor(combinedImage);
    svgCanvas.selectOnly([combinedImage]);
    undoManager.addCommandToHistory(parentCmd);
  }

  progressCaller.popById('convert-svg-to-image');

  return result;
};
