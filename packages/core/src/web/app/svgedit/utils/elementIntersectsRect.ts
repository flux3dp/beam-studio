import paper from 'paper';

import type { IRect } from '@core/interfaces/ISVGCanvas';

import rectsIntersect from './rectsIntersect';

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

// getPointAtLength re-walks the path's segment list on every call (~ms per
// call on a glyph-outline path), so for <path> elements parse the d attribute
// once with paper.js and run a proper curve-vs-rect intersection instead.
// Returns null when paper cannot handle the data, to fall back to probing.
const pathDIntersectsRect = (d: string, rect: IRect, matrix: DOMMatrix): boolean | null => {
  try {
    if (!paper.project) paper.setup(new paper.Size(1, 1));

    const compound = new paper.CompoundPath({ insert: false, pathData: d });

    compound.transform(new paper.Matrix(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f));

    const rectPath = new paper.Path.Rectangle({
      insert: false,
      point: [rect.x, rect.y],
      size: [rect.width, rect.height],
    });

    if (compound.intersects(rectPath)) return true;

    // a subpath (e.g. one glyph) can lie entirely inside the band without
    // its outline ever crossing the band edge
    const subpaths = compound.children.length
      ? (compound.children as paper.Path[])
      : [compound as unknown as paper.Path];

    return subpaths.some((subpath) => {
      const point = subpath.firstSegment?.point;

      return Boolean(point) && rectPath.contains(point);
    });
  } catch {
    return null;
  }
};

// Fallback for shapes without a d attribute (ellipse, rect, line...), where
// getPointAtLength is cheap. Subdivide arc-length spans and prune: a point at
// most `span` local units along the path from a probed point cannot be farther
// than `span * scale` content units away from it, so a span whose probed
// endpoint is farther from the band than it can travel is skipped whole.
const outlineIntersectsRect = (elem: SVGGeometryElement, rect: IRect, matrix: DOMMatrix): boolean => {
  const d = elem.getAttribute('d');

  if (d) {
    const paperResult = pathDIntersectsRect(d, rect, matrix);

    if (paperResult !== null) return paperResult;
  }

  let total: number;

  try {
    total = elem.getTotalLength();
  } catch {
    return true;
  }

  if (!total) return true;

  // scale factor from element-local units to content user units
  const scale = Math.hypot(matrix.a, matrix.b) || 1;
  // subdivision stops via the distance prune below; this tiny floor only bounds
  // the depth. It must NOT be derived from the band size: a path can clip a
  // large band's corner with an arbitrarily short arc, so band-sized spans
  // cannot be skipped unprobed
  const resolution = total / 4096;

  // distance from a content-space point to the band, 0 if inside
  const distToRect = ({ x, y }: { x: number; y: number }) =>
    Math.hypot(Math.max(rect.x - x, x - rect.x - rect.width, 0), Math.max(rect.y - y, y - rect.y - rect.height, 0));
  const probe = (dist: number) => {
    const p = elem.getPointAtLength(dist);

    return distToRect(applyMatrix(matrix, p.x, p.y));
  };

  // ponytail: 2048-probe cap; an over-budget path reports no hit, which can
  // miss a selection on absurdly complex geometry near the band
  let budget = 2048;
  const dStart = probe(0);

  if (dStart === 0) return true;

  // spans as [lo, hi, distance from point at lo to the band]
  const stack: Array<[number, number, number]> = [[0, total, dStart]];

  while (stack.length && budget > 0) {
    const [lo, hi, dLo] = stack.pop()!;
    const span = hi - lo;

    // no point within this span can reach the band
    if (dLo > span * scale) continue;

    if (span <= resolution) continue;

    const mid = (lo + hi) / 2;

    budget -= 1;

    const dMid = probe(mid);

    if (dMid === 0) return true;

    stack.push([lo, mid, dLo], [mid, hi, dMid]);
  }

  return false;
};

/**
 * Precise (narrow-phase) intersection test between an element and a rect in
 * content user space. Bbox overlap alone selects hollow shapes (a C shape, a
 * sparse group) when the rect lies entirely in their empty interior, so
 * geometry leaves are re-tested along their outline and groups recurse into
 * their children.
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
