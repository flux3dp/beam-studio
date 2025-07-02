import history from '@core/app/svgedit/history/history';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import updateElementColor from './color/updateElementColor';
import { getSVGAsync } from './svg-editor-helper';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const convertSvgToImage = async (
  svgElement: SVGGElement,
  opts?: { offset?: number[]; parentCmd?: IBatchCommand },
): Promise<SVGImageElement> => {
  const { offset = [0, 0], parentCmd } = opts ?? {};
  const bbox = svgElement.getBBox();
  // Create a new <svg> wrapper element to hold the cloned SVG
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  wrapper.setAttribute('width', String(bbox.width));
  wrapper.setAttribute('height', String(bbox.height));

  const cloned = svgElement.cloneNode(true) as SVGGraphicsElement;

  cloned.setAttribute('transform', `translate(${-bbox.x}, ${-bbox.y})`);
  wrapper.appendChild(cloned);

  const svgData = new XMLSerializer().serializeToString(wrapper);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(blob);

  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load the generated SVG.'));
    };
    img.src = svgUrl;
  });

  const { height, width } = img;

  // 4. Create the new <image> element
  const newImage = svgCanvas.addSvgElementFromJson({
    attr: {
      'data-source-type': 'svg',
      height,
      id: svgCanvas.getNextId(),
      origImage: img.src,
      preserveAspectRatio: 'xMidYMid meet',
      style: 'pointer-events:inherit',
      width,
      x: offset[0],
      y: offset[1],
    },
    element: 'image',
  });

  await new Promise<void>((resolve) => {
    svgCanvas.setHref(newImage, img.src);
    updateElementColor(newImage);
    svgCanvas.selectOnly([newImage]);

    const cmd = new history.InsertElementCommand(newImage);

    if (!parentCmd) {
      svgCanvas.undoMgr.addCommandToHistory(cmd);
    } else {
      parentCmd.addSubCommand(cmd);
    }

    if (!offset) {
      svgCanvas.alignSelectedElements('l', 'page');
      svgCanvas.alignSelectedElements('t', 'page');
    }

    resolve();
  });

  return newImage as SVGImageElement;
};
