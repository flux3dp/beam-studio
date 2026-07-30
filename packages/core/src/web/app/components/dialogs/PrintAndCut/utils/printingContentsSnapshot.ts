import { getBBox } from '@core/app/svgedit/utils/getBBox';

import { measureWithLayersShown } from './measure';

/**
 * Identity of one design element as it was when the sheets were printed. The id
 * alone is not enough: deleting an element releases its id (see `releaseId` in
 * draw.js), so an element created later can be handed the same one. Comparing
 * the tag and the rounded bounding box as well makes a recycled id — and a
 * moved, resized or replaced element — detectable.
 */
export interface PrintingContentsElementSnapshot {
  /** bounding box height in canvas units (px), rounded */
  h: number;
  id: string;
  tag: string;
  /** bounding box width in canvas units (px), rounded */
  w: number;
  /** bounding box x in canvas units (px), rounded */
  x: number;
  /** bounding box y in canvas units (px), rounded */
  y: number;
}

/** How a stored snapshot compares against the current document */
export interface PrintingContentsMatch {
  isPrintingContentsChanged: boolean;
  /**
   * Ids of the design elements to render in the resume preview: null keeps the
   * whole live design (configs written before snapshots existed), while an
   * empty list renders no artwork at all — when the design changed, only the
   * frozen paper, marks and cut path still describe the printed sheet.
   */
  printingContentsElementIds: null | string[];
}

export const snapshotElement = (
  element: SVGElement,
  bbox: { height: number; width: number; x: number; y: number },
): PrintingContentsElementSnapshot => ({
  h: Math.round(bbox.height),
  id: element.id,
  tag: element.tagName,
  w: Math.round(bbox.width),
  x: Math.round(bbox.x),
  y: Math.round(bbox.y),
});

const isUnchanged = (item: PrintingContentsElementSnapshot): boolean => {
  const element = document.getElementById(item.id) as null | SVGElement;

  if (!element || element.tagName !== item.tag) return false;

  const { h, w, x, y } = snapshotElement(element, getBBox(element));

  return h === item.h && w === item.w && x === item.x && y === item.y;
};

/**
 * Check a saved snapshot against the current document to decide what the resume
 * preview may show. Elements added since the sheets were printed are simply
 * left out; anything missing or altered invalidates the whole preview, because
 * the printed sheet can no longer be reconstructed from the canvas.
 */
export const matchPrintingContents = (
  snapshot: null | PrintingContentsElementSnapshot[] | undefined,
): PrintingContentsMatch => {
  if (!snapshot) return { isPrintingContentsChanged: false, printingContentsElementIds: null };

  const isPrintingContentsChanged = measureWithLayersShown(() => !snapshot.every(isUnchanged));

  return {
    isPrintingContentsChanged,
    printingContentsElementIds: isPrintingContentsChanged ? [] : snapshot.map(({ id }) => id),
  };
};
