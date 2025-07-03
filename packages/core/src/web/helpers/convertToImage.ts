import history from '@core/app/svgedit/history/history';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import updateElementColor from './color/updateElementColor';
import { getSVGAsync } from './svg-editor-helper';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

type ConvertSvgToImageParams = {
  parentCmd?: IBatchCommand;
  positionOffset?: number[];
  scale?: number;
  svgElement: SVGGElement;
};

export const convertSvgToImage = async ({
  parentCmd,
  positionOffset = [50, 50],
  scale = 1,
  svgElement,
}: ConvertSvgToImageParams): Promise<SVGImageElement | undefined> => {
  let svgUrl: null | string = null;

  try {
    const bbox = svgElement.getBBox();
    // Create a new <svg> wrapper element to hold the cloned SVG
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const isFilled = svgElement.getAttribute('fill') !== 'none' && svgElement.getAttribute('fill') !== null;
    const cloned = svgElement.cloneNode(true) as SVGGraphicsElement;
    let strokeOffset = 0;

    if (!isFilled) {
      strokeOffset = 5;
    }

    wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrapper.setAttribute('width', String(bbox.width + strokeOffset));
    wrapper.setAttribute('height', String(bbox.height + strokeOffset));

    cloned.setAttribute('fill', '#000');

    if (!isFilled) {
      cloned.setAttribute('fill', 'none');
      cloned.setAttribute('stroke', '#000');
      cloned.setAttribute('stroke-width', String(strokeOffset));
    }

    cloned.setAttribute('transform', `translate(${-bbox.x + strokeOffset / 2}, ${-bbox.y + strokeOffset / 2})`);
    wrapper.appendChild(cloned);

    const svgData = new XMLSerializer().serializeToString(wrapper);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

    svgUrl = URL.createObjectURL(blob);

    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load the generated SVG.'));
      img.src = svgUrl!;
    });

    const { height, width } = img;
    const newImage = svgCanvas.addSvgElementFromJson({
      attr: {
        'data-ratiofixed': true,
        'data-shading': true,
        'data-threshold': 254,
        height,
        id: svgCanvas.getNextId(),
        origImage: img.src,
        preserveAspectRatio: 'none',
        style: 'pointer-events:inherit',
        width,
        x: svgElement.getAttribute('x')! + positionOffset[0],
        y: svgElement.getAttribute('y')! + positionOffset[1],
      },
      element: 'image',
    });

    svgCanvas.setHref(newImage, img.src);
    updateElementColor(newImage);
    svgCanvas.selectOnly([newImage]);

    const cmd = new history.InsertElementCommand(newImage);

    if (!parentCmd) {
      svgCanvas.undoMgr.addCommandToHistory(cmd);
    } else {
      parentCmd.addSubCommand(cmd);
    }

    if (!positionOffset) {
      svgCanvas.alignSelectedElements('l', 'page');
      svgCanvas.alignSelectedElements('t', 'page');
    }

    return newImage as SVGImageElement;
  } catch (error) {
    console.error('Failed during SVG to Image conversion:', error);
  }
};
