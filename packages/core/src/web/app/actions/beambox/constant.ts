const removeReadonly = <T extends string>(arr: ReadonlyArray<T[number]> | T[]) => arr as string[];

export const supportUsbModelsArray = ['ado1', 'fhexa1', 'fhx2rf3', 'fhx2rf6', 'fpm1', 'fbb2'] as const;
export type SupportUsbModels = (typeof supportUsbModelsArray)[number];
export const supportUsbModelsStrict = new Set(supportUsbModelsArray);
export const supportUsbModels = new Set(removeReadonly(supportUsbModelsArray));

export const bb2ModelsArray = ['fbb2'] as const;
export type Bb2Models = (typeof bb2ModelsArray)[number];
export const bb2ModelsStrict = new Set(bb2ModelsArray);
export const bb2Models = new Set(removeReadonly(bb2ModelsArray));

export const hexaRfModelsArray = ['fhx2rf3', 'fhx2rf6'] as const;
export type HexaRfModels = (typeof hexaRfModelsArray)[number];
export const hexaRfModelsStrict = new Set(hexaRfModelsArray);
export const hexaRfModels = new Set(removeReadonly(hexaRfModelsArray));

export const adorModelsArray = ['ado1', 'fad1'] as const;
export const adorModels = new Set(adorModelsArray);

export const promarkModelsArray = ['fpm1'] as const;
export const promarkModels = new Set(promarkModelsArray);

export const modelsWithModules = new Set([...adorModelsArray, 'fbm2']);

export const PreviewSpeedLevel = {
  FAST: 3,
  MEDIUM: 2,
  SLOW: 1,
} as const;
export type PreviewSpeedLevelType = (typeof PreviewSpeedLevel)[keyof typeof PreviewSpeedLevel];

export const dpmm = 10;

export default {
  adorModels: adorModelsArray,
  allowedWorkarea: {
    ado1: adorModelsArray,
    fad1: adorModelsArray,
    fbb1b: ['fbb1b', 'fbm1'],
    fbb1p: ['fbb1p', 'fbb1b', 'fbm1'],
    fbb2: [...bb2ModelsArray, 'fbm2'], // TODO: add fbm2 until beamo2 machine model updated
    fbm1: ['fbm1'],
    fbm2: ['fbm2'],
    fhexa1: ['fhexa1', 'fbb1p', 'fbb1b', 'fbm1'],
    fhx2rf3: ['fhx2rf3', 'fhx2rf6', 'fhexa1', 'fbb1p', 'fbb1b', 'fbm1'],
    fhx2rf6: ['fhx2rf3', 'fhx2rf6', 'fhexa1', 'fbb1p', 'fbb1b', 'fbm1'],
    flv1: ['flv1'],
    fpm1: ['fpm1'],
    'laser-b1': ['fhexa1', 'fbb1p', 'fbb1b', 'fbm1'],
    'laser-b2': ['fhexa1', 'fbb1p', 'fbb1b', 'fbm1'],
  },
  borderless: {
    safeDistance: {
      X: 40, // mm
    },
  },
  camera: {
    calibrationPicture: {
      centerX: 90, // mm
      centerY: 90, // mm
      size: 25, // mm
    },
    imgHeight: 280, // pixel
    imgWidth: 640, // pixel
    offsetX_ideal: 20, // mm
    offsetY_ideal: 30, // mm
    scaleRatio_ideal: (585 / 720) * 2, // pixel on studio / pixel on beambox machine; 與焦距成正比
  },
  diode: {
    calibrationPicture: {
      centerX: 159, // mm
      centerY: 96, // mm
      offsetX: 69, // mm
      offsetY: 6, // mm
    },
    defaultOffsetX: 70, // mm
    defaultOffsetY: 7, // mm
    limitX: 50, // mm
    limitY: 10, // mm
    safeDistance: {
      X: 50, // mm
      Y: 15, // mm
    },
  },
  dpiValueMap: {
    high: 500,
    low: 125,
    medium: 250,
    ultra: 1000,
  },
  dpmm,
  fcodeV2Models: new Set([...adorModelsArray, ...bb2ModelsArray, ...hexaRfModelsArray, 'fbm2']),
  highPowerModels: ['fhx2rf3', 'fhx2rf6', 'fhexa1', 'ado1', 'flv1', 'fpm1'],
};
