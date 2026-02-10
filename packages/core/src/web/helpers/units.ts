import round from '@core/helpers/math/round';

export type DisplayUnit = 'inch' | 'mm';
export type Units = 'cm' | 'inch' | 'mm' | 'pt' | 'px' | 'text';
export type TimeUnits = 'h' | 'm' | 'ms' | 's';

const dpi = 72;
const svgUnitScaling = 254 / dpi; // 本來 72 個點代表 1 inch, 現在 254 個點代表 1 inch.
const unitMap = {
  cm: 10 * 10,
  inch: 25.4 * 10,
  mm: 10,
  pt: 1,
  px: svgUnitScaling,
  text: 1, // self made
};

const timeUnitMap = {
  h: 60 * 60,
  m: 60,
  ms: 0.001,
  s: 1,
};

const convertUnit = (val: number, to: Units, from: Units = 'pt', precision?: number): number => {
  let ret = val;

  if (to !== from && unitMap[to]) {
    ret = (val * unitMap[from]) / unitMap[to];
  }

  if (precision !== undefined) {
    ret = round(ret, precision);
  }

  return ret;
};

const convertTimeUnit = (val: number, to: TimeUnits, from: TimeUnits = 's'): number => {
  if (to === from || !timeUnitMap[to]) {
    return val;
  }

  return (val * timeUnitMap[from]) / timeUnitMap[to];
};

export default {
  convertTimeUnit,
  convertUnit,
  timeUnitMap,
  unitMap,
};
