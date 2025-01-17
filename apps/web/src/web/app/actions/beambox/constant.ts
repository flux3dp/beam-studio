const removeReadonly = <T extends string>(arr: T[] | readonly T[number][]) => arr as string[];

export const supportUsbModelsArray = ['ado1', 'fhexa1', 'fpm1', 'fbb2'] as const;
export type SupportUsbModels = (typeof supportUsbModelsArray)[number];
export const supportUsbModelsStrict = new Set(supportUsbModelsArray);
export const supportUsbModels = new Set(removeReadonly(supportUsbModelsArray));

export const bb2ModelsArray = ['fbb2'] as const;
export type Bb2Models = (typeof bb2ModelsArray)[number];
export const bb2ModelsStrict = new Set(bb2ModelsArray);
export const bb2Models = new Set(removeReadonly(bb2ModelsArray));

export const adorModels = new Set(['ado1', 'fad1']);
export const promarkModels = new Set(['fpm1']);
export enum PreviewSpeedLevel {
  SLOW = 1,
  MEDIUM = 2,
  FAST = 3,
}

export default {
  dpmm: 10,
  camera: {
    imgWidth: 640, // pixel
    imgHeight: 280, // pixel
    offsetX_ideal: 20, // mm
    offsetY_ideal: 30, // mm
    scaleRatio_ideal: (585 / 720) * 2, // pixel on studio / pixel on beambox machine; 與焦距成正比
    calibrationPicture: {
      centerX: 90, // mm
      centerY: 90, // mm
      size: 25, // mm
    },
  },
  borderless: {
    safeDistance: {
      X: 40, // mm
    },
  },
  diode: {
    calibrationPicture: {
      offsetX: 69, // mm
      offsetY: 6, // mm
      centerX: 159, // mm
      centerY: 96, // mm
    },
    limitX: 50, // mm
    limitY: 10, // mm
    defaultOffsetX: 70, // mm
    defaultOffsetY: 7, // mm
    safeDistance: {
      X: 50, // mm
      Y: 15, // mm
    },
  },
  allowedWorkarea: {
    fbb2: ['fbb2'],
    'laser-b2': ['fhexa1', 'fbb1p', 'fbb1b', 'fbm1'],
    'laser-b1': ['fhexa1', 'fbb1p', 'fbb1b', 'fbm1'],
    fhexa1: ['fhexa1', 'fbb1p', 'fbb1b', 'fbm1'],
    fbb1p: ['fbb1p', 'fbb1b', 'fbm1'],
    fbb1b: ['fbb1b', 'fbm1'],
    fbm1: ['fbm1'],
    ado1: ['ado1', 'fad1'],
    fad1: ['ado1', 'fad1'],
    fpm1: ['fpm1'],
    flv1: ['flv1'],
  },
  adorModels: ['ado1', 'fad1'],
  highPowerModels: ['fhexa1', 'ado1', 'flv1', 'fpm1'],
  fcodeV2Models: new Set(['ado1', 'fbb2']),
  dpiValueMap: {
    low: 125,
    medium: 250,
    high: 500,
    ultra: 1000,
  },
};
