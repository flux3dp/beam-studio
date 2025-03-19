// ref: https://www.notion.so/flux3dp/030619b6721849498cadc57e660107d3?pvs=4

export enum LayerModule {
  LASER_10W_DIODE = 1, // or default CO2 laser for BeamSeries
  LASER_20W_DIODE = 2,
  LASER_1064 = 4,
  LASER_UNIVERSAL = 15,
  PRINTER = 5,
  UNKNOWN = 9,
  UV_EXPORT = -1,
}

export const fullColorModulesArray = [LayerModule.PRINTER, LayerModule.UV_EXPORT] as const;
export const fullColorModules = new Set(fullColorModulesArray);
