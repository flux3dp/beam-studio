import history from '@core/app/svgedit/history/history';
import { getRotationAngle, setRotationAngle } from '@core/app/svgedit/transform/rotation';
import workareaManager from '@core/app/svgedit/workarea';

import { getObjectLayer } from '../layer/layer-helper';

import { createAndFinalizeImage } from './createAndFinalizeImage';
import { getPngUrlFromSvg } from './getPngUrlFromSvg';
import { getTransformedCoordinates } from './getTransformedCoordinates';
import type { ConvertSvgToImageParams, ConvertToImageResult } from './types';

const getStrokeWidth = () => {
  const { zoomRatio } = workareaManager;

  return Math.max(0.85 / zoomRatio + 0.85, 2);
};

/**
 * A generic function to rasterize an SVG element (shapes, text) into an image.
 * This function merges the logic of three previous functions.
 */
export async function rasterizeGenericSvgElement({
  isToSelect = true,
  parentCmd = new history.BatchCommand('Convert Generic Svg to Image'),
  svgElement,
}: ConvertSvgToImageParams): Promise<ConvertToImageResult> {
  try {
    const angle = getRotationAngle(svgElement);
    const cloned = svgElement.cloneNode(true) as SVGGraphicsElement;

    setRotationAngle(cloned, 0, { addToHistory: false });

    // Rasterization start
    const bbox = svgElement.getBBox();
    const isFilled = !['none', null].includes(svgElement.getAttribute('fill'));
    const { elem: layerElement } = getObjectLayer(svgElement);
    const isFullColor = layerElement.getAttribute('data-fullcolor') === '1';
    // Prepare return-to-zero transform
    const previousTransform = cloned.getAttribute('transform');
    const strokeOffset = isFilled ? 0 : getStrokeWidth();

    if (!isFullColor) {
      cloned.setAttribute('fill', '#000');
      cloned.setAttribute('stroke', '#000');
    }

    if (!isFilled) cloned.setAttribute('stroke-width', String(strokeOffset));

    let finalCoords = { x: bbox.x - strokeOffset / 2, y: bbox.y - strokeOffset / 2 };
    let finalWidth = bbox.width + strokeOffset;
    let finalHeight = bbox.height + strokeOffset;
    const isTransformedElement = svgElement.tagName === 'text' || svgElement.getAttribute('data-textpath-g') === '1';
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    if (isTransformedElement) {
      const transformed = getTransformedCoordinates(bbox, previousTransform);
      const scale = Number.parseFloat(previousTransform?.match(/matrix\(([^,]+)/)?.[1] || '1');

      finalCoords = { x: transformed.x - (strokeOffset / 2) * scale, y: transformed.y - (strokeOffset / 2) * scale };
      finalWidth *= scale;
      finalHeight *= scale;

      if (previousTransform) cloned.setAttribute('transform', previousTransform);
    }

    wrapper.setAttribute('display', 'block');
    wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrapper.setAttribute('width', String(Math.abs(finalWidth)));
    wrapper.setAttribute('height', String(Math.abs(finalHeight)));

    if (finalWidth < 0) finalCoords.x += finalWidth;

    if (finalHeight < 0) finalCoords.y += finalHeight;

    wrapper.setAttribute(
      'viewBox',
      `${finalCoords.x} ${finalCoords.y} ${Math.abs(finalWidth) + strokeOffset} ${Math.abs(finalHeight) + strokeOffset}`,
    );
    wrapper.appendChild(cloned);

    const img = new Image();
    const href = await getPngUrlFromSvg(wrapper, { img });

    return await createAndFinalizeImage(
      { angle, height: img.height, href, transform: '', width: img.width, x: finalCoords.x, y: finalCoords.y },
      { isToSelect, parentCmd, svgElement },
    );
  } catch (error) {
    console.error('Failed during SVG rasterization:', error);

    return undefined;
  }
}
