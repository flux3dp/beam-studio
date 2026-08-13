import { pipe } from 'remeda';

import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import beamFileHelper from '@core/helpers/beam-file-helper';
import { withMemoryLog, withMemoryLogSync } from '@core/helpers/debug/memoryLog';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { getSvgContentActualBBox } from './getBBox';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const generateBeamThumbnail = async (): Promise<ArrayBuffer | null> => {
  const { maxY, minY, width } = workareaManager;
  const svgContent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
  const bbox = await getSvgContentActualBBox();
  const right = Math.min(bbox.x + bbox.width, width);
  const bottom = Math.min(bbox.y + bbox.height, maxY);

  bbox.x = Math.max(bbox.x, 0);
  bbox.y = Math.max(bbox.y, minY);
  bbox.width = right - bbox.x;
  bbox.height = bottom - bbox.y;

  if (bbox.width <= 0 || bbox.height <= 0) {
    return null;
  }

  const [imageWidth, imageHeight] = pipe(
    // calculate down ratio
    300 / Math.max(bbox.width, bbox.height),
    // calculate image width and height
    (downRatio) => [Math.ceil(bbox.width * downRatio), Math.ceil(bbox.height * downRatio)],
  );
  const svgDefs = findDefs();
  const clonedSvgContent = svgContent.cloneNode(true) as SVGSVGElement;
  const useElements = clonedSvgContent.querySelectorAll('use');

  useElements.forEach((useElement) => SymbolMaker.switchImageSymbol(useElement, false));

  const svgString = `
    <svg
      width="${imageWidth}"
      height="${imageHeight}"
      viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}"
      xmlns:svg="http://www.w3.org/2000/svg"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      ${svgDefs.outerHTML}
      ${clonedSvgContent.innerHTML}
    </svg>`;
  const canvas = await svgStringToCanvas(svgString, imageWidth, imageHeight);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
  });

  return blob.arrayBuffer();
};

/** Sizes of what goes into the .beam file, so a crash can be tied to the document rather than guessed at. */
const logInputSizes = (imageSource: Record<string, ArrayBuffer>, svgString: string): void => {
  const ids = Object.keys(imageSource);
  const imageBytes = ids.reduce((sum, id) => sum + imageSource[id].byteLength, 0);

  console.log(
    `[mem] generateBeamBuffer inputs | ${ids.length} images ${(imageBytes / 1024 / 1024).toFixed(0)}MB` +
      ` | svgString ${(svgString.length / 1024 / 1024).toFixed(0)}MB`,
  );
};

/**
 * A Blob-safe view over a Buffer. This is a view, not a copy — the bytes are not touched.
 *
 * Buffer's backing store is typed ArrayBufferLike, which admits SharedArrayBuffer, so BlobPart
 * rejects it outright.
 */
export const toBlobPart = (buffer: Buffer) =>
  new Uint8Array(buffer.buffer as ArrayBuffer, buffer.byteOffset, buffer.byteLength);

export const generateBeamBuffer = async (): Promise<Buffer> =>
  withMemoryLog('generateBeamBuffer', async () => {
    const imageSource = await withMemoryLog('generateBeamBuffer: getImageSource', () => svgCanvas.getImageSource());
    const svgString = withMemoryLogSync('generateBeamBuffer: getSvgString', () => svgCanvas.getSvgString());
    const thumbnail = await withMemoryLog('generateBeamBuffer: thumbnail', generateBeamThumbnail);

    logInputSizes(imageSource, svgString);

    return withMemoryLogSync('generateBeamBuffer: assemble', () =>
      beamFileHelper.generateBeamBuffer(svgString, imageSource, thumbnail || undefined),
    );
  });
