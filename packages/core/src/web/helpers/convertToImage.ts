import { match } from 'ts-pattern';

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

export type ConvertSvgToImageParams = {
  isToSelect?: boolean;
  parentCmd?: IBatchCommand;
  positionOffset?: number[];
  scale?: number;
  svgElement: SVGGElement;
};

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
export const commonSvgTags = ['rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'path'] as const;

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

export const convertCommonSvgToImage = async ({
  isToSelect = true,
  parentCmd,
  positionOffset = [0, 0],
  svgElement,
}: ConvertSvgToImageParams): Promise<SVGImageElement | undefined> => {
  let svgUrl: null | string = null;

  if (!commonSvgTags.includes(svgElement.tagName)) {
    return undefined;
  }

  try {
    const bbox = svgElement.getBBox();
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const isFilled = svgElement.getAttribute('fill') !== 'none' && svgElement.getAttribute('fill') !== null;
    const cloned = svgElement.cloneNode(true) as SVGGraphicsElement;
    let strokeOffset = 0;

    if (!isFilled) {
      strokeOffset = 5;
    }

    wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrapper.setAttribute('width', String(bbox.width * 1 + strokeOffset));
    wrapper.setAttribute('height', String(bbox.height * 1 + strokeOffset));

    cloned.setAttribute('fill', '#000');
    cloned.setAttribute('stroke', '#000');

    if (!isFilled) {
      cloned.setAttribute('fill', 'none');
      cloned.setAttribute('stroke-width', String(strokeOffset));
    }

    cloned.setAttribute('transform', `translate(${-bbox.x + strokeOffset / 2}, ${-bbox.y + strokeOffset / 2}) `);
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
        x: bbox.x + positionOffset[0],
        y: bbox.y + positionOffset[1],
      },
      element: 'image',
    });

    svgCanvas.setHref(newImage, img.src);
    updateElementColor(newImage);

    if (isToSelect) {
      svgCanvas.selectOnly([newImage]);
    }

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

export const convertTextToImage = async ({
  isToSelect = true,
  parentCmd,
  positionOffset = [0, 0],
  svgElement,
}: ConvertSvgToImageParams): Promise<SVGImageElement | undefined> => {
  let svgUrl: null | string = null;

  if (svgElement.tagName !== 'text') {
    return undefined;
  }

  try {
    const bbox = svgElement.getBBox();
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const isFilled = svgElement.getAttribute('fill') !== 'none' && svgElement.getAttribute('fill') !== null;
    const cloned = svgElement.cloneNode(true) as SVGGraphicsElement;
    const previousTransform = cloned.getAttribute('transform');
    const transformScale = cloned
      .getAttribute('transform')
      ?.match(/matrix\(([^)]+)\)/)![1]
      .split(' ')[0] as unknown as number;
    const transformedCoordinates = getTransformedCoordinates(bbox, previousTransform);
    let strokeOffset = 0;

    if (!isFilled) {
      strokeOffset = 5;
    }

    wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrapper.setAttribute('width', String(bbox.width * (transformScale || 1)));
    wrapper.setAttribute('height', String(bbox.height * (transformScale || 1)));

    cloned.setAttribute('fill', '#000');
    cloned.setAttribute('stroke', '#000');

    if (!isFilled) {
      cloned.setAttribute('fill', 'none');
      cloned.setAttribute('stroke-width', String(strokeOffset));
    }

    cloned.setAttribute(
      'transform',
      `translate(${-transformedCoordinates.x}, ${-transformedCoordinates.y}) ${previousTransform ?? ''}`,
    );
    wrapper.appendChild(cloned);

    const svgData = new XMLSerializer().serializeToString(wrapper);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const img = new Image();

    svgUrl = URL.createObjectURL(blob);

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
        x: transformedCoordinates.x! + positionOffset[0],
        y: transformedCoordinates.y! + positionOffset[1],
      },
      element: 'image',
    });

    svgCanvas.setHref(newImage, img.src);
    updateElementColor(newImage);

    if (isToSelect) {
      svgCanvas.selectOnly([newImage]);
    }

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

export const convertTextOnPathToImage = async ({
  isToSelect = true,
  parentCmd,
  positionOffset = [0, 0],
  svgElement,
}: ConvertSvgToImageParams): Promise<SVGImageElement | undefined> => {
  let svgUrl: null | string = null;

  console.log('Converting text on path to image:', svgElement);

  try {
    const bbox = svgElement.getBBox();
    // Create a new <svg> wrapper element to hold the cloned SVG
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const isFilled = svgElement.getAttribute('fill') !== 'none' && svgElement.getAttribute('fill') !== null;
    const cloned = svgElement.cloneNode(true) as SVGGraphicsElement;
    const previousTransform = cloned.getAttribute('transform');
    const transformScale = cloned
      .getAttribute('transform')
      ?.match(/matrix\(([^)]+)\)/)![1]
      .split(' ')[0] as unknown as number;
    const transformedCoordinates = getTransformedCoordinates(bbox, previousTransform);
    let strokeOffset = 0;

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
        x: transformedCoordinates.x + positionOffset[0],
        y: transformedCoordinates.y + positionOffset[1],
      },
      element: 'image',
    });

    svgCanvas.setHref(newImage, img.src);
    updateElementColor(newImage);

    if (isToSelect) {
      svgCanvas.selectOnly([newImage]);
    }

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

export const convertUseToImage = async ({
  isToSelect = true,
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

  if (isToSelect) {
    svgCanvas.selectOnly([image]);
  }

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

export const convertGroupToImage = async ({
  parentCmd,
  positionOffset = [0, 0],
  svgElement,
}: ConvertSvgToImageParams): Promise<SVGImageElement | undefined> => {
  const list = [];

  for await (const child of svgElement.children) {
    const image = await match(child)
      .with({ tagName: 'use' }, async (useElement) =>
        convertUseToImage({ isToSelect: false, parentCmd, positionOffset, svgElement: useElement as SVGGElement }),
      )
      .with({ tagName: 'text' }, async (textElement) =>
        convertTextToImage({ isToSelect: false, parentCmd, positionOffset, svgElement: textElement as SVGGElement }),
      )
      .when(
        (element) => element.getAttribute('data-textpath-g') === '1',
        async (element) =>
          convertTextOnPathToImage({
            isToSelect: false,
            parentCmd,
            positionOffset,
            svgElement: element as SVGGElement,
          }),
      )
      .with({ tagName: 'g' }, async (groupElement) =>
        convertGroupToImage({ isToSelect: false, parentCmd, positionOffset, svgElement: groupElement as SVGGElement }),
      )
      .otherwise(async (child) =>
        convertCommonSvgToImage({ isToSelect: false, parentCmd, positionOffset, svgElement: child as SVGGElement }),
      );

    if (image) {
      list.push(image);
    }
  }

  console.log(svgElement.children);

  console.log('Converted images:', list);

  svgCanvas.selectOnly(list);
  svgCanvas.tempGroupSelectedElements();
  svgCanvas.groupSelectedElements();

  return undefined;
};

export const convertSvgToImage = async ({
  parentCmd,
  positionOffset = [0, 0],
  svgElement,
}: ConvertSvgToImageParams): Promise<SVGImageElement | undefined> => {
  if (svgElement.tagName === 'use') {
    console.log('Converting use to image:', svgElement);

    return convertUseToImage({ parentCmd, positionOffset, svgElement: svgElement as SVGGElement });
  }

  if (svgElement.tagName === 'text') {
    console.log('Converting text to image:', svgElement);

    return convertTextToImage({ parentCmd, positionOffset, svgElement: svgElement as SVGGElement });
  }

  if (svgElement.tagName === 'g' && svgElement.getAttribute('data-textpath-g') === '1') {
    console.log('Converting text-on-path to image:', svgElement);

    return convertTextOnPathToImage({ parentCmd, positionOffset, svgElement: svgElement as SVGGElement });
  }

  if (svgElement.tagName === 'g') {
    console.log('Converting group to image:', svgElement);

    return convertGroupToImage({ parentCmd, positionOffset, svgElement: svgElement as SVGGElement });
  }

  if (commonSvgTags.includes(svgElement.tagName)) {
    console.log('Converting common SVG to image:', svgElement);

    return convertCommonSvgToImage({ parentCmd, positionOffset, svgElement: svgElement as SVGGElement });
  }

  console.log('The provided SVG element is not convertible:', svgElement.tagName);
};
