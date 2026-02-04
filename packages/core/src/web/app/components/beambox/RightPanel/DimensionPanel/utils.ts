import constant from '@core/app/actions/beambox/constant';
import type { DimensionKeyShort, DimensionValues } from '@core/interfaces/ObjectPanel';

export const getValue = (
  dimensionValues: DimensionValues,
  type: DimensionKeyShort,
  opts: {
    allowUndefined?: boolean;
    unit?: 'in' | 'mm' | 'px';
  } = {},
): number => {
  const { allowUndefined = false, unit = 'px' } = opts;
  let val: number | undefined;

  if (type === 'w') {
    val = dimensionValues?.width;
  } else if (type === 'h') {
    val = dimensionValues?.height;
  } else if (type === 'rx') {
    val = dimensionValues?.rx ? dimensionValues?.rx * 2 : dimensionValues?.rx;
  } else if (type === 'ry') {
    val = dimensionValues?.ry ? dimensionValues?.ry * 2 : dimensionValues?.ry;
  } else {
    val = dimensionValues?.[type];
  }

  if (val === undefined) {
    if (allowUndefined) {
      return undefined;
    }

    val = 0;
  }

  if (unit === 'px') {
    return val;
  }

  val /= constant.dpmm;

  if (unit === 'in') {
    val /= 25.4;
  }

  return val;
};

export default {};
