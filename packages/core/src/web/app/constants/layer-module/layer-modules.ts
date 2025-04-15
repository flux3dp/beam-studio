// ref: https://www.notion.so/flux3dp/030619b6721849498cadc57e660107d3?pvs=4

/* eslint-disable perfectionist/sort-objects */
export const LayerModule = {
  LASER_10W_DIODE: 1, // or default CO2 laser for BeamSeries
  LASER_20W_DIODE: 2,
  LASER_1064: 4,
  PRINTER: 5,
  PRINTER_4C: 6, // temp
  UNKNOWN: 9,
  LASER_UNIVERSAL: 15,
  UV_PRINT: -1,
} as const;
/* eslint-enable perfectionist/sort-objects */
export type LayerModuleType = (typeof LayerModule)[keyof typeof LayerModule];

export const printingModules = new Set([LayerModule.PRINTER, LayerModule.PRINTER_4C]);

export const fullColorModulesArray = [LayerModule.PRINTER, LayerModule.PRINTER_4C, LayerModule.UV_PRINT] as const;
export const fullColorModules = new Set(fullColorModulesArray);
