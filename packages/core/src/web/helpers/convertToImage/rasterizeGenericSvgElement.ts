import history from '@core/app/svgedit/history/history';
import { getRotationAngle, setRotationAngle } from '@core/app/svgedit/transform/rotation';
import workareaManager from '@core/app/svgedit/workarea';

import { getObjectLayer } from '../layer/layer-helper';

import { createAndFinalizeImage } from './createAndFinalizeImage';
import { getPngUrlFromSvg } from './getPngUrlFromSvg';
import type { ConvertSvgToImageParams, ConvertToImageResult } from './types';

const getStrokeWidth = () => {
  const { zoomRatio } = workareaManager;

  return Math.max(0.85 / zoomRatio + 0.85, 1.5);
};

/** Prepares a clone of the SVG element for rasterization. */
const prepareElementForRaster = (svgElement: SVGGraphicsElement) => {
  const cloned = svgElement.cloneNode(true) as SVGGraphicsElement;

  setRotationAngle(cloned, 0, { addToHistory: false });

  const isFilled = !['none', null].includes(svgElement.getAttribute('fill'));
  const isFullColor = getObjectLayer(svgElement)?.elem.getAttribute('data-fullcolor') === '1';
  const strokeOffset = isFilled ? 0 : getStrokeWidth();

  if (!isFullColor) {
    cloned.setAttribute('fill', '#000');
    cloned.setAttribute('stroke', '#000');
  }

  if (!isFilled) {
    cloned.setAttribute('fill', 'none');
    cloned.setAttribute('stroke-width', String(strokeOffset));
  }

  return { cloned, strokeOffset };
};

/** Creates an SVG wrapper with the correct dimensions and viewBox. */
const createSvgWrapper = (
  { height, width, x, y }: Record<'height' | 'width' | 'x' | 'y', number>,
  element: SVGGraphicsElement,
) => {
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  wrapper.setAttribute('display', 'block');
  wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  wrapper.setAttribute('width', String(Math.abs(width)));
  wrapper.setAttribute('height', String(Math.abs(height)));

  let viewBoxX = x;
  let viewBoxY = y;

  if (width < 0) viewBoxX = x + width;

  if (height < 0) viewBoxY = y + height;

  wrapper.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${Math.abs(width)} ${Math.abs(height)}`);
  wrapper.appendChild(element);

  return wrapper;
};

/**
 * A generic function to rasterize an SVG element (shapes, text) into an image.
 */
export async function rasterizeGenericSvgElement({
  isToSelect = true,
  parentCmd = new history.BatchCommand('Convert Generic Svg to Image'),
  svgElement,
}: ConvertSvgToImageParams): Promise<ConvertToImageResult> {
  try {
    // 1. Get initial state and prepare the element
    const angle = getRotationAngle(svgElement);
    const { cloned, strokeOffset } = prepareElementForRaster(svgElement);

    // 2. Calculate final dimensions
    const bbox = svgElement.getBBox();
    const initialDimensions = {
      height: bbox.height + strokeOffset,
      width: bbox.width + strokeOffset,
      x: bbox.x - strokeOffset / 2,
      y: bbox.y - strokeOffset / 2,
    };

    // 3. Create wrapper, rasterize, and finalize
    const wrapper = createSvgWrapper(initialDimensions, cloned);
    const img = new Image();
    const href = await getPngUrlFromSvg(wrapper, { img });
    const dimensions = { height: img.height, width: img.width, x: initialDimensions.x, y: initialDimensions.y };

    return await createAndFinalizeImage({ angle, dimensions, href }, { isToSelect, parentCmd, svgElement });
  } catch (error) {
    console.error('Failed during SVG rasterization:', error);

    return undefined;
  }
}
