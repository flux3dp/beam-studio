import { match, P } from 'ts-pattern';

import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { deleteElements } from '@core/app/svgedit/operations/delete';

import { convertGroupToImage } from './convertGroupToImage';
import { convertUseToImage } from './convertUseToImage';
import { rasterizeGenericSvgElement } from './rasterizeGenericSvgElement';
import type { MainConverterFunc } from './types';

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
