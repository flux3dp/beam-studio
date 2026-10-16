import paper from 'paper';

/**
 * Removes near-zero-length curves from a path (in place), handling CompoundPath children.
 *
 * paperjs-offset's `adaptiveOffsetCurve` recurses by subdividing each curve until the offset
 * error falls below a threshold. Sub-pixel "degenerate" curves — a common artifact in
 * hand-authored icon SVGs (e.g. icon-sagittarius, which has a `l0,0` and several sub-0.01
 * unit beziers) — never converge, so the recursion overflows the stack with
 * "RangeError: Maximum call stack size exceeded". Note that `paper.Path.reduce()` and `unite()`
 * do NOT remove these. Collapsing them is geometrically negligible (verified: identical offset
 * area/bounds) and makes the offset robust for any imported shape.
 *
 * When collapsing a degenerate curve we transfer the dropped anchor's `handleOut` onto its
 * neighbor before removing it. The two anchors are within `minLength` of each other, so the
 * relative handle still reconstructs the *following* curve's tangent. Simply removing the anchor
 * (without this transfer) discards that tangent and visibly dents shapes whose degenerate point
 * carries a real outgoing handle (e.g. GEOMETRY_1's `…199.246V199.247C474.949…`).
 */
export const removeDegenerateCurves = (item: paper.PathItem, minLength = 0.01): void => {
  const paths = item instanceof paper.CompoundPath ? (item.children as paper.Path[]) : [item as paper.Path];

  for (const path of paths) {
    for (let i = path.curves.length - 1; i >= 0; i -= 1) {
      // Keep at least two segments so the path stays valid.
      if (path.segments.length <= 2) break;

      const curve = path.curves[i];

      if (curve.length < minLength) {
        curve.segment1.handleOut = curve.segment2.handleOut;
        curve.segment2.remove();
      }
    }
  }
};
