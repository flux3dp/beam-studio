// ref: https://www.notion.so/flux3dp/030619b6721849498cadc57e660107d3?pvs=4

/* eslint-disable perfectionist/sort-enums */
enum LayerModule {
  LASER_10W_DIODE = 1, // or default CO2 laser for BeamSeries
  LASER_20W_DIODE = 2,
  LASER_1064 = 4,
  PRINTER = 5,
  PRINTER_4C = 6, // temp
  UNKNOWN = 9,
  LASER_UNIVERSAL = 15,
}
/* eslint-enable perfectionist/sort-enums */

export const modelsWithModules = new Set(['fad1', 'ado1']);
export const printingModules = new Set([LayerModule.PRINTER, LayerModule.PRINTER_4C]);

export default LayerModule;
