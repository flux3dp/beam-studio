import type { IRect } from '@core/interfaces/ISVGCanvas';

import rectsIntersect from './rectsIntersect';

const pointInRect = (rect: IRect, x: number, y: number): boolean =>
  x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;

const applyMatrix = (m: DOMMatrix, x: number, y: number) => ({
  x: m.a * x + m.c * y + m.e,
  y: m.b * x + m.d * y + m.f,
});

// axis-aligned hull of a local-space rect mapped to content user space
const mapRectHull = (bbox: IRect, matrix: DOMMatrix): IRect => {
  const corners = [
    applyMatrix(matrix, bbox.x, bbox.y),
    applyMatrix(matrix, bbox.x + bbox.width, bbox.y),
    applyMatrix(matrix, bbox.x + bbox.width, bbox.y + bbox.height),
    applyMatrix(matrix, bbox.x, bbox.y + bbox.height),
  ];
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);

  return {
    height: Math.max(...ys) - Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    x: Math.min(...xs),
    y: Math.min(...ys),
  };
};

const textIntersectsRect = (elem: SVGTextContentElement, rect: IRect, matrix: DOMMatrix): boolean => {
  let count: number;

  try {
    count = elem.getNumberOfChars();
  } catch {
    return true;
  }

  // no chars (or absurdly many) -> keep the bbox answer
  if (!count || count > 512) return true;

  for (let i = 0; i < count; i++) {
    if (rectsIntersect(rect, mapRectHull(elem.getExtentOfChar(i), matrix))) return true;
  }

  return false;
};

const outlineIntersectsRect = (elem: SVGGeometryElement, rect: IRect, matrix: DOMMatrix): boolean => {
  let total: number;

  try {
    total = elem.getTotalLength();
  } catch {
    return true;
  }

  if (!total) return true;

  // scale factor from element-local units to content user units
  const scale = Math.hypot(matrix.a, matrix.b) || 1;
  // half the band's smaller dimension (in local units): a segment crossing the
  // band cannot be stepped over at this spacing
  // ponytail: capped at 512 samples; an extremely long path may step past a tiny
  // band — raise the cap or subdivide per-segment if users hit it
  const sampleLength = Math.max(Math.min(rect.width, rect.height) / 2 / scale, total / 512);

  for (let i = 0; i <= total + sampleLength; i += sampleLength) {
    const dist = Math.min(i, total); // clamp so the endpoint is sampled exactly
    const point = elem.getPointAtLength(dist);
    const { x, y } = applyMatrix(matrix, point.x, point.y);

    if (pointInRect(rect, x, y)) return true;
  }

  return false;
};

/**
 * Precise (narrow-phase) intersection test between an element and a rect in
 * content user space. Bbox overlap alone selects hollow shapes (a C shape, a
 * sparse group) when the rect lies entirely in their empty interior, so
 * geometry leaves are re-tested by sampling their outline and groups recurse
 * into their children.
 * @param contentCtmInverse inverse of the content element's screen CTM
 */
export const elementIntersectsRect = (element: Element, rect: IRect, contentCtmInverse: DOMMatrix): boolean => {
  const elem = element as SVGGraphicsElement;

  // instanceof SVGGraphicsElement / SVGGeometryElement would be cleaner, but
  // jsdom does not implement them; duck-type instead
  if (typeof elem.getBBox !== 'function' || typeof elem.getScreenCTM !== 'function') return false;

  const screenCtm = elem.getScreenCTM();

  if (!screenCtm) return true;

  // maps element-local coordinates to content user space (same space as rect)
  const matrix = contentCtmInverse.multiply(screenCtm);
  let bbox: DOMRect;

  try {
    bbox = elem.getBBox();
  } catch {
    return false;
  }

  if (!rectsIntersect(rect, mapRectHull(bbox, matrix))) return false;

  if (elem.tagName === 'g') {
    return Array.from(elem.childNodes).some(
      (child) => child instanceof Element && elementIntersectsRect(child, rect, contentCtmInverse),
    );
  }

  if (typeof (elem as SVGGeometryElement).getTotalLength === 'function') {
    return outlineIntersectsRect(elem as SVGGeometryElement, rect, matrix);
  }

  // text is hollow like a C shape when laid along a path, so test per-character
  // extents, which hug the actual glyphs
  if (typeof (elem as SVGTextContentElement).getNumberOfChars === 'function') {
    return textIntersectsRect(elem as SVGTextContentElement, rect, matrix);
  }

  // image / use have no outline to sample; their bbox is close enough
  return true;
};

export default elementIntersectsRect;
