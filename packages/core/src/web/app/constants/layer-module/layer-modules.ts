import { invert } from 'remeda';
// ref: https://www.notion.so/flux3dp/030619b6721849498cadc57e660107d3?pvs=4

/* eslint-disable perfectionist/sort-objects */
/**
 * Layer Module ID when exporting task
 */
export const LayerModule = {
  UV_PRINT: -1,
  LASER_10W_DIODE: 1, // or default CO2 laser for BeamSeries
  LASER_20W_DIODE: 2,
  LASER_1064: 4,
  PRINTER: 5,
  PRINTER_4C: 7,
  // virtual values for uv layer (they are seen as printer 4c in firmware)
  UV_WHITE_INK: 8,
  UV_VARNISH: 9,
  LASER_UNIVERSAL: 15,
} as const;

/**
 * Layer Module ID reporting from device info (used in device info display)
 */
export const DetectedLayerModule = {
  NONE: 0, // placeholder for device info search
  LASER_10W_DIODE: 1, // or default CO2 laser for BeamSeries
  LASER_20W_DIODE: 2,
  LASER_1064: 4,
  PRINTER: 5,
  PRINTER_4C: 7,
  PRINTER_4C_WITH_1064: 8,
  UNKNOWN: 9,
  PRINTER_4C_WITH_UV: 10,
  PRINTER_4C_WITH_UV_1064: 11,
} as const;
/* eslint-enable perfectionist/sort-objects */
export type LayerModuleType = (typeof LayerModule)[keyof typeof LayerModule];
export type DetectedLayerModuleType = (typeof DetectedLayerModule)[keyof typeof DetectedLayerModule];

export const laserModules = new Set<LayerModuleType>([
  LayerModule.LASER_10W_DIODE,
  LayerModule.LASER_20W_DIODE,
  LayerModule.LASER_1064,
  LayerModule.LASER_UNIVERSAL,
]);
export const printingModules = new Set<LayerModuleType>([LayerModule.PRINTER, LayerModule.PRINTER_4C]);

export const fullColorModulesArray = [LayerModule.PRINTER, LayerModule.PRINTER_4C, LayerModule.UV_PRINT] as const;
export const fullColorModules = new Set<LayerModuleType>(fullColorModulesArray);
export const fullColorHeadModules = [LayerModule.PRINTER_4C, LayerModule.UV_WHITE_INK, LayerModule.UV_VARNISH];
// uv for fuv1, not for uv printing export
export const UVModules = new Set<LayerModuleType>([LayerModule.UV_WHITE_INK, LayerModule.UV_VARNISH]);

const ModuleNameToValue = invert(LayerModule);

export const getLayerModuleName = (module: LayerModuleType): string => {
  return ModuleNameToValue[module] ?? '';
};
