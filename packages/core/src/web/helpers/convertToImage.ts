import { pipe } from 'remeda';

import { dpmm } from '@core/app/actions/beambox/constant';
import history from '@core/app/svgedit/history/history';
import findDefs from '@core/app/svgedit/utils/findDef';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import {
  type ConvertSvgToImageParams,
  type ConvertToImageResult,
  createAndFinalizeImage,
  getUnionBBox,
} from './convertToImage.util';
import svgStringToCanvas from './image/svgStringToCanvas';
import { getObjectLayer, sortLayerNamesByPosition } from './layer/layer-helper';
import { getSVGAsync } from './svg-editor-helper';
import symbolMaker from './symbol-helper/symbolMaker';
import { convertVariableText } from './variableText';

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

const switchSymbolWrapper = <T>(fn: () => T): T => {
  symbolMaker.switchImageSymbolForAll(false);

  try {
    return fn();
  } finally {
    symbolMaker.switchImageSymbolForAll(true);
  }
};

const getLayerTitles = (svgElement: SVGElement): string[] => {
  const titles: string[] = [];
  const elements: SVGElement[] = [svgElement];
  const getLayerTitle = (element: SVGElement) => {
    if (element.tagName === 'g') {
      elements.push(...(element.children as unknown as SVGElement[]));

      return;
    }

    titles.push(getObjectLayer(element)?.title);
  };

  while (elements.length > 0) {
    const currentElement = elements.pop()!;

    getLayerTitle(currentElement);
  }

  return titles.filter(Boolean);
};

// Assuming BBox type is defined
type BBox = { height: number; width: number; x: number; y: number };
type Options = { dpi?: number };

/**
 * Generates a base64 encoded image from a given set of elements and their union bounding box.
 *
 * @param elements - The SVG elements to include in the export.
 * @param bbox - The union bounding box of the elements.
 * @param options - Export options like DPI.
 * @returns A promise that resolves to a base64 data URL string.
 */
export const elementsToImageBase64 = async (elements: SVGElement[], bbox: BBox, options?: Options): Promise<string> => {
  // 1. Get options or use defaults
  const { dpi = 300 } = options || {};

  // 2. Calculate the final pixel dimensions of the canvas based on the bbox and DPI
  // (This ratio calculation is preserved from your original function)
  const ratio = dpi / (dpmm * 25.4);
  const canvasWidth = Math.round(bbox.width * ratio);
  const canvasHeight = Math.round(bbox.height * ratio);

  // 3. Get necessary SVG components
  const svgDefs = findDefs(); // To include shared definitions like gradients or patterns
  const elementsHtml = elements.map((el) => el.outerHTML).join('');

  // 4. Construct the SVG string. The viewBox is now determined entirely by the unionBBox,
  // creating a tightly cropped view of the elements.
  const svgString = `
    <svg
      width="${canvasWidth}"
      height="${canvasHeight}"
      viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      ${svgDefs.outerHTML}
      <g>
        ${elementsHtml}
      </g>
    </svg>`;

  // 5. Render the SVG to a canvas using your existing helper
  const canvas = await svgStringToCanvas(svgString, canvasWidth, canvasHeight);

  // 6. Return the canvas content as a base64 data URL
  return canvas.toDataURL('image/png');
};

export const convertSvgToImage = async ({
  isToSelect = true,
  parentCmd = new history.BatchCommand('Convert SVG to Image'),
  svgElement,
}: ConvertSvgToImageParams): Promise<ConvertToImageResult> => {
  const layer = pipe(svgElement, getLayerTitles, sortLayerNamesByPosition, (titles) => titles.at(-1));
  const bbox = getUnionBBox([svgElement])!;

  // svgCanvas.clearSelection();
  svgCanvas.removeUnusedDefs();

  const revert = await convertVariableText();
  const base64 = await switchSymbolWrapper(() =>
    elementsToImageBase64([svgElement.cloneNode(true) as SVGGElement], bbox!, { dpi: 300 }),
  );

  revert?.();

  console.log(layer);
  console.log(bbox);

  await createAndFinalizeImage(
    { angle: 0, height: bbox.height, href: base64, transform: '', width: bbox.width, x: bbox.x, y: bbox.y },
    { isToSelect, parentCmd, svgElement },
  );

  // const output = switchSymbolWrapper(() => rasterizeGenericSvgElement(svgElement, { isToSelect, parentCmd }));

  return undefined;
};
