export type Units = 'inch' | 'cm' | 'mm' | 'px' | 'pt' | 'text';
export type TimeUnits = 'h' | 'm' | 's' | 'ms';

const dpi = 72;
const svgUnitScaling = 254 / dpi; // 本來 72 個點代表 1 inch, 現在 254 個點代表 1 inch.
const unitMap = {
  inch: 25.4 * 10,
  cm: 10 * 10,
  mm: 10,
  px: svgUnitScaling,
  pt: 1,
  text: 1, // self made
};

const timeUnitMap = {
  h: 60 * 60,
  m: 60,
  s: 1,
  ms: 0.001,
};

const convertUnit = (val: number, to: Units, from: Units = 'pt'): number => {
  if (to === from || !unitMap[to]) {
    return val;
  }
  return (val * unitMap[from]) / unitMap[to];
};

const convertTimeUnit = (val: number, to: TimeUnits, from: TimeUnits = 's'): number => {
  if (to === from || !timeUnitMap[to]) {
    return val;
  }
  return (val * timeUnitMap[from]) / timeUnitMap[to];
};

export default {
  unitMap,
  timeUnitMap,
  convertUnit,
  convertTimeUnit,
};
