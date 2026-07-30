import { markBaseRadiusPx } from '../constants';

export interface MarkPosition {
  cx: number;
  cy: number;
}

/**
 * Four alignment marks, one outside each corner of the design bounding box.
 * `cutExpansionPx` is how far the cut path extends beyond the bbox — the
 * contour offset distance (0 in layer mode, where the cut elements are part
 * of the bbox). Each mark center sits diagonally outside the expanded corner
 * by the base radius, clears the corner (arc) by (markBaseRadiusPx)·(√2 − 1)
 * All values are in canvas units (px).
 */
export const computeMarkPositions = (
  designBBox: {
    height: number;
    width: number;
    x: number;
    y: number;
  },
  cutExpansionPx = 0,
): MarkPosition[] => {
  const { height, width, x, y } = designBBox;
  const offset = cutExpansionPx + markBaseRadiusPx;

  return [
    { cx: x - offset, cy: y - offset },
    { cx: x + width + offset, cy: y - offset },
    { cx: x - offset, cy: y + height + offset },
    { cx: x + width + offset, cy: y + height + offset },
  ];
};

/**
 * Bounding box of the design plus its alignment marks (including their white
 * base discs), in canvas units (px).
 */
export const getContentBBox = (
  designBBox: { height: number; width: number; x: number; y: number },
  marks: MarkPosition[],
): { height: number; width: number; x: number; y: number } => {
  let { x: minX, y: minY } = designBBox;
  let maxX = designBBox.x + designBBox.width;
  let maxY = designBBox.y + designBBox.height;

  marks.forEach(({ cx, cy }) => {
    minX = Math.min(minX, cx - markBaseRadiusPx);
    minY = Math.min(minY, cy - markBaseRadiusPx);
    maxX = Math.max(maxX, cx + markBaseRadiusPx);
    maxY = Math.max(maxY, cy + markBaseRadiusPx);
  });

  return { height: maxY - minY, width: maxX - minX, x: minX, y: minY };
};
