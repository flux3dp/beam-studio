import { pipe } from 'remeda';

import history from '@core/app/svgedit/history/history';
import { getRotationAngle, setRotationAngle } from '@core/app/svgedit/transform/rotation';
import workareaManager from '@core/app/svgedit/workarea';

import { createAndFinalizeImage } from './createAndFinalizeImage';
import { getTransformedCoordinates } from './getTransformedCoordinates';
import type { ConvertSvgToImageParams, ConvertToImageResult } from './types';

const getStrokeWidth = () => {
  const { zoomRatio } = workareaManager;

  return Math.max(0.85 / zoomRatio + 0.85, 1.5);
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
    // Prepare return-to-zero transform
    const previousTransform = cloned.getAttribute('transform');
    const strokeOffset = isFilled ? 0 : getStrokeWidth();

    cloned.setAttribute('fill', '#000');
    cloned.setAttribute('stroke', '#000');

    if (!isFilled) cloned.setAttribute('stroke-width', String(strokeOffset));

    if (svgElement.getAttribute('data-textpath-g') === '1') {
      Array.from(cloned.children).forEach((child) => {
        if (child instanceof SVGGraphicsElement) {
          child.setAttribute('fill', '#000');
          child.setAttribute('stroke', '#000');
        }
      });
    }

    let finalCoords = { x: bbox.x - strokeOffset / 2, y: bbox.y - strokeOffset / 2 };
    let finalWidth = bbox.width + strokeOffset;
    let finalHeight = bbox.height + strokeOffset;
    const isTransformedElement = svgElement.tagName === 'text' || svgElement.getAttribute('data-textpath-g') === '1';
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    if (isTransformedElement) {
      console.log('isTransformedElement', Boolean(previousTransform));

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

    // Create image from blob URL
    const svgUrl = pipe(
      new XMLSerializer().serializeToString(wrapper),
      (svgData) => new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }),
      URL.createObjectURL,
    );
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load the generated SVG.'));
      img.src = svgUrl;
    });

    return await createAndFinalizeImage(
      { angle, height: img.height, href: img.src, transform: '', width: img.width, x: finalCoords.x, y: finalCoords.y },
      { isToSelect, parentCmd, svgElement },
    );
  } catch (error) {
    console.error('Failed during SVG rasterization:', error);

    return undefined;
  }
}
