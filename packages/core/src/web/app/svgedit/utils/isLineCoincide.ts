import round from '@core/helpers/math/round';

export function isLineCoincide(
  { x1: x11, x2: x12, y1: y11, y2: y12 }: { x1: number; x2: number; y1: number; y2: number },
  { x1: x21, x2: x22, y1: y21, y2: y22 }: { x1: number; x2: number; y1: number; y2: number },
) {
  x11 = round(x11, 2);
  x12 = round(x12, 2);
  y11 = round(y11, 2);
  y12 = round(y12, 2);
  x21 = round(x21, 2);
  x22 = round(x22, 2);
  y21 = round(y21, 2);
  y22 = round(y22, 2);

  const isXCoincide =
    Math.min(x11, x12) + 5 <= Math.max(x21, x22) - 5 && Math.min(x21, x22) + 5 <= Math.max(x11, x12) - 5;
  const isYCoincide =
    Math.min(y11, y12) + 5 <= Math.max(y21, y22) - 5 && Math.min(y21, y22) + 5 <= Math.max(y11, y12) - 5;

  if (x11 === x12) return isYCoincide && x11 === x21 && x12 === x22;

  if (y11 === y12) return isXCoincide && y11 === y21 && y12 === y22;

  return false;
}
