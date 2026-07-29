import { getBBox, getBBoxFromElements } from '@core/app/svgedit/utils/getBBox';

import { PRINT_AND_CUT_LAYER_ATTR } from '../constants';

const contentTags = new Set(['circle', 'ellipse', 'g', 'image', 'line', 'path', 'polygon', 'rect', 'text', 'use']);

export interface CanvasContents {
  designBBox: { height: number; width: number; x: number; y: number };
  elements: SVGElement[];
}

/**
 * Collect the top level content elements of all visible layers and the
 * bounding box of the whole design.
 */
export const collectCanvasContents = (): CanvasContents => {
  // exclude a previously generated cutting layer so its cut lines are never
  // treated as design content (e.g. when starting over after a finish)
  const layers = document.querySelectorAll(
    `#svgcontent > g.layer:not([display="none"]):not([${PRINT_AND_CUT_LAYER_ATTR}])`,
  );
  const elements: SVGElement[] = [];

  layers.forEach((layer) => {
    [...layer.children].forEach((child) => {
      if (!contentTags.has(child.tagName)) return;

      const bbox = getBBox(child as SVGGraphicsElement);

      if (bbox.width === 0 && bbox.height === 0) return;

      elements.push(child as SVGElement);
    });
  });

  return { designBBox: getBBoxFromElements(elements as SVGGraphicsElement[]), elements };
};
