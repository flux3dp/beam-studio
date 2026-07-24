import { getBBox, getBBoxFromElements } from '@core/app/svgedit/utils/getBBox';

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
  const layers = document.querySelectorAll('#svgcontent > g.layer:not([display="none"])');
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
