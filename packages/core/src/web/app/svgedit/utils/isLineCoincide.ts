import round from '@core/helpers/math/round';

function roundAll(obj: Record<string, number>) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, round(value, 2)]));
}

export function isLineCoincide(
  line1: { x1: number; x2: number; y1: number; y2: number },
  line2: { x1: number; x2: number; y1: number; y2: number },
) {
  const { x1: x11, x2: x12, y1: y11, y2: y12 } = roundAll(line1);
  const { x1: x21, x2: x22, y1: y21, y2: y22 } = roundAll(line2);

  const isXCoincide =
    Math.min(x11, x12) + 5 <= Math.max(x21, x22) - 5 && Math.min(x21, x22) + 5 <= Math.max(x11, x12) - 5;
  const isYCoincide =
    Math.min(y11, y12) + 5 <= Math.max(y21, y22) - 5 && Math.min(y21, y22) + 5 <= Math.max(y11, y12) - 5;

  if (x11 === x12) return isYCoincide && x11 === x21 && x12 === x22;

  if (y11 === y12) return isXCoincide && y11 === y21 && y12 === y22;

  return false;
}
