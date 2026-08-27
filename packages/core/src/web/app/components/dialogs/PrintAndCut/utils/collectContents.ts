import { CanvasElements } from '@core/app/constants/canvasElements';
import { getBBox, getBBoxFromElements } from '@core/app/svgedit/utils/getBBox';

import { getContentsLayers } from './contentsLayers';
import { measureWithLayersShown } from './measure';
import type { PrintingContentsElementSnapshot } from './printingContentsSnapshot';
import { snapshotElement } from './printingContentsSnapshot';

/** Tags treated as design content; also what the resume preview filters on */
export const contentTags = new Set([...CanvasElements.visibleElems, 'circle']);

export interface CanvasContents {
  elements: SVGElement[];
  printingContentsBBox: { height: number; width: number; x: number; y: number };
  /** Identities of the collected elements, frozen into the saved config on finish */
  printingContentsElements: PrintingContentsElementSnapshot[];
}

/**
 * Collect the top level content elements and the bounding box of the whole
 * design.
 */
export const collectCanvasContents = (): CanvasContents => {
  const layers = getContentsLayers();

  // content layers can be hidden; getBBox reports zeros under display:none
  return measureWithLayersShown(() => {
    const elements: SVGElement[] = [];
    const printingContentsElements: PrintingContentsElementSnapshot[] = [];

    layers.forEach((layer) => {
      [...layer.children].forEach((child) => {
        if (!contentTags.has(child.tagName)) return;

        const bbox = getBBox(child as SVGGraphicsElement);

        if (bbox.width === 0 && bbox.height === 0) return;

        elements.push(child as SVGElement);

        // an element without an id cannot be recognized again on resume; it still
        // counts as design content, it just takes no part in the change check
        if (child.id) printingContentsElements.push(snapshotElement(child as SVGElement, bbox));
      });
    });

    return {
      elements,
      printingContentsBBox: getBBoxFromElements(elements as SVGGraphicsElement[]),
      printingContentsElements,
    };
  });
};
