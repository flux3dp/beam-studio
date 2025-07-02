import history from '@core/app/svgedit/history/history';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import updateElementColor from './color/updateElementColor';
import { getSVGAsync } from './svg-editor-helper';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

/**
 * Converts an SVG element into an SVG <image> element.
 * @param svgElement The source SVG element (e.g., <g>, <rect>).
 * @param opts Options for placement, scaling, and history management.
 * @returns A promise that resolves with the newly created SVGImageElement.
 */
export const convertSvgToImage = async (
  svgElement: SVGGElement,
  opts?: { offset?: number[]; parentCmd?: IBatchCommand; scale?: number },
): Promise<SVGImageElement> => {
  const { offset = [0, 0], parentCmd, scale = 1 } = opts ?? {};

  let svgUrl: null | string = null;

  try {
    const bbox = svgElement.getBBox();
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    // Set width/height on the wrapper for the Image loader to read
    wrapper.setAttribute('width', String(bbox.width * scale));
    wrapper.setAttribute('height', String(bbox.height * scale));
    wrapper.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

    const cloned = svgElement.cloneNode(true) as SVGGraphicsElement;

    wrapper.appendChild(cloned);

    const svgData = new XMLSerializer().serializeToString(wrapper);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

    svgUrl = URL.createObjectURL(blob);

    // Re-introduce the Image loading step for safety and validation
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load the generated SVG into an image.'));
      img.src = svgUrl!;
    });

    // Now, use the validated dimensions from the loaded image
    const { height, width } = img;

    const newImage = svgCanvas.addSvgElementFromJson({
      attr: {
        'data-ratiofixed': true,
        'data-shading': true,
        'data-threshold': 254,
        height, // Use validated height
        id: svgCanvas.getNextId(),
        origImage: svgUrl,
        preserveAspectRatio: 'xMidYMid meet',
        style: 'pointer-events:inherit',
        width, // Use validated width
        x: offset[0],
        y: offset[1],
      },
      element: 'image',
    });

    svgCanvas.setHref(newImage, svgUrl);
    updateElementColor(newImage);
    svgCanvas.selectOnly([newImage]);

    const cmd = new history.InsertElementCommand(newImage);

    if (!parentCmd) {
      svgCanvas.undoMgr.addCommandToHistory(cmd);
    } else {
      parentCmd.addSubCommand(cmd);
    }

    if (!offset.every((v) => v === 0)) {
      svgCanvas.alignSelectedElements('l', 'page');
      svgCanvas.alignSelectedElements('t', 'page');
    }

    return newImage as SVGImageElement;
  } catch (error) {
    console.error('Failed during SVG to Image conversion:', error);
    throw error;
  } finally {
    // This ensures the blob URL is always revoked
    if (svgUrl) {
      URL.revokeObjectURL(svgUrl);
    }
  }
};
