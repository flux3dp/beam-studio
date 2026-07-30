import { markBaseRadiusPx } from '../constants';

export interface MarkPosition {
  cx: number;
  cy: number;
}

/**
 * Four alignment marks, one outside each corner of the layout box — which is
 * the extent of the cut path itself. All values are in canvas units (px).
 */
export const computeMarkPositions = (fullBBox: {
  height: number;
  width: number;
  x: number;
  y: number;
}): MarkPosition[] => {
  const { height, width, x, y } = fullBBox;
  const offset = markBaseRadiusPx;

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
  printingContentsBBox: { height: number; width: number; x: number; y: number },
  marks: MarkPosition[],
): { height: number; width: number; x: number; y: number } => {
  let { x: minX, y: minY } = printingContentsBBox;
  let maxX = printingContentsBBox.x + printingContentsBBox.width;
  let maxY = printingContentsBBox.y + printingContentsBBox.height;

  marks.forEach(({ cx, cy }) => {
    minX = Math.min(minX, cx - markBaseRadiusPx);
    minY = Math.min(minY, cy - markBaseRadiusPx);
    maxX = Math.max(maxX, cx + markBaseRadiusPx);
    maxY = Math.max(maxY, cy + markBaseRadiusPx);
  });

  return { height: maxY - minY, width: maxX - minX, x: minX, y: minY };
};
