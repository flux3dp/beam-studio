import history from '@core/app/svgedit/history/history';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import updateElementColor from './color/updateElementColor';
import { getSVGAsync } from './svg-editor-helper';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

type BBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type ConvertSvgToImageParams = {
  parentCmd?: IBatchCommand;
  positionOffset?: number[];
  scale?: number;
  svgElement: SVGGElement;
};

/**
 * Calculates the new coordinates of a point after applying an SVG matrix transform.
 * @param bbox The original bbox.
 * @param transform The SVG transform attribute string (e.g., "matrix(a,b,c,d,e,f)").
 * @returns A new bbox with the transformed coordinates.
 */
export const getTransformedCoordinates = (bbox: BBox, transform: null | string): BBox => {
  // If there's no transform string, return the original point
  if (!transform) {
    return bbox;
  }

  const matrixMatch = transform.match(/matrix\(([^)]+)\)/);

  if (matrixMatch?.[1]) {
    const matrixValues = matrixMatch[1].split(/[\s,]+/).map(Number);

    if (matrixValues.length === 6) {
      const [a, b, c, d, e, f] = matrixValues;
      const { x, y } = bbox;

      // Apply the standard matrix transformation formula
      const newX = a * x + c * y + e;
      const newY = b * x + d * y + f;
      const newWidth = bbox.width * Math.sqrt(a * a + b * b);
      const newHeight = bbox.height * Math.sqrt(c * c + d * d);

      return { height: newHeight, width: newWidth, x: newX, y: newY };
    }
  }

  console.warn('No valid matrix transform found. Returning original coordinates.');

  return bbox;
};

export const convertUseToImage = async ({
  parentCmd,
  positionOffset = [0, 0],
  svgElement,
}: ConvertSvgToImageParams): Promise<SVGImageElement | undefined> => {
  if (!svgElement.getAttribute('xlink:href')) {
    console.warn('The provided SVG element does not have a valid href attribute.');

    return;
  }

  const symbolId = svgElement.getAttribute('xlink:href')!;
  const symbol = document.querySelector(symbolId);
  const href = symbol?.children[0]?.getAttribute('href')!;
  const x = Number.parseFloat(svgElement.getAttribute('x') || '0');
  const y = Number.parseFloat(svgElement.getAttribute('y') || '0');
  const [width, height] = svgElement
    .getAttribute('data-xform')!
    .split(' ')
    .slice(2, 4)
    .map((value) => Number.parseFloat(value.split('=')[1]));
  const previousTransform = svgElement.getAttribute('transform');
  const transformedCoordinates = getTransformedCoordinates({ height, width, x, y }, previousTransform);

  console.log('Transformed Coordinates:', transformedCoordinates);

  const image = svgCanvas.addSvgElementFromJson({
    attr: {
      'data-ratiofixed': true,
      'data-shading': true,
      'data-threshold': 254,
      height: transformedCoordinates.height,
      id: svgCanvas.getNextId(),
      origImage: href,
      preserveAspectRatio: 'none',
      style: 'pointer-events:inherit',
      width: transformedCoordinates.width,
      x: positionOffset[0] + transformedCoordinates.x,
      y: positionOffset[1] + transformedCoordinates.y,
    },
    element: 'image',
  });

  svgCanvas.setHref(image, href);
  updateElementColor(image);
  svgCanvas.selectOnly([image]);

  const cmd = new history.InsertElementCommand(image);

  if (!parentCmd) {
    svgCanvas.undoMgr.addCommandToHistory(cmd);
  } else {
    parentCmd.addSubCommand(cmd);
  }

  if (!positionOffset) {
    svgCanvas.alignSelectedElements('l', 'page');
    svgCanvas.alignSelectedElements('t', 'page');
  }

  return image as SVGImageElement;
};

export const convertSvgToImage = async ({
  parentCmd,
  positionOffset = [0, 0],
  svgElement,
}: ConvertSvgToImageParams): Promise<SVGImageElement | undefined> => {
  let svgUrl: null | string = null;

  if (svgElement.tagName === 'use') {
    return convertUseToImage({ parentCmd, positionOffset, svgElement: svgElement as SVGGElement });
  }

  try {
    const bbox = svgElement.getBBox();
    // Create a new <svg> wrapper element to hold the cloned SVG
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const isFilled = svgElement.getAttribute('fill') !== 'none' && svgElement.getAttribute('fill') !== null;
    const cloned = svgElement.cloneNode(true) as SVGGraphicsElement;
    const previousTransform = cloned.getAttribute('transform');
    let strokeOffset = 0;

    const transformScale = cloned
      .getAttribute('transform')
      ?.match(/matrix\(([^)]+)\)/)![1]
      .split(' ')[0] as unknown as number;
    const transformedCoordinates = getTransformedCoordinates(bbox, previousTransform);

    if (!isFilled) {
      strokeOffset = 5;
    }

    wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrapper.setAttribute('width', String(bbox.width * (transformScale || 1) + strokeOffset));
    wrapper.setAttribute('height', String(bbox.height * (transformScale || 1) + strokeOffset));

    cloned.setAttribute('fill', '#000');
    cloned.setAttribute('stroke', '#000');

    if (cloned.children.length) {
      Array.from(cloned.children).forEach((child) => {
        if (child instanceof SVGGraphicsElement) {
          child.setAttribute('fill', '#000');
          child.setAttribute('stroke', '#000');
        }
      });
    }

    if (!isFilled) {
      cloned.setAttribute('fill', 'none');
      cloned.setAttribute('stroke-width', String(strokeOffset));
    }

    cloned.setAttribute(
      'transform',
      `translate(${-transformedCoordinates.x + strokeOffset / 2}, ${-transformedCoordinates.y + strokeOffset / 2}) ${previousTransform ?? ''}`,
    );
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
