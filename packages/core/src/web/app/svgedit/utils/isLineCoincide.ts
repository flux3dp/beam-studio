import round from '@core/helpers/math/round';

function isSameAlignedLine(a1: number, a2: number, b1: number, b2: number) {
  const isAxisAligned = (a1: number, a2: number, b1: number, b2: number) => a1 === a2 || b1 === b2;
  const isSamePosition = (a1: number, a2: number, b1: number, b2: number) =>
    (a1 === b1 && a2 === b2) || (a1 === b2 && a2 === b1);

  return isAxisAligned(a1, a2, b1, b2) && isSamePosition(a1, a2, b1, b2);
}

function isCoincide(a1: number, a2: number, b1: number, b2: number) {
  /**
   * This offset is to prevent the lines from being considered coincident when their endpoints are the same.
   */
  const OFFSET = 5;

  return (
    Math.min(a1, a2) + OFFSET <= Math.max(b1, b2) - OFFSET && Math.min(b1, b2) + OFFSET <= Math.max(a1, a2) - OFFSET
  );
}

function roundAll(obj: Record<string, number>) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, round(value, 2)]));
}

export function isLineCoincide(
  line1: { x1: number; x2: number; y1: number; y2: number },
  line2: { x1: number; x2: number; y1: number; y2: number },
) {
  const { x1: x11, x2: x12, y1: y11, y2: y12 } = roundAll(line1);
  const { x1: x21, x2: x22, y1: y21, y2: y22 } = roundAll(line2);

  if (isSameAlignedLine(x11, x12, x21, x22)) return isCoincide(y11, y12, y21, y22);

  if (isSameAlignedLine(y11, y12, y21, y22)) return isCoincide(x11, x12, x21, x22);

  return false;
}
