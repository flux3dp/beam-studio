import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import { checkBM2UV } from '@core/helpers/checkFeature';
import type { TAccelerationOverride } from '@core/interfaces/ITaskConfig';

import { LayerModule, type LayerModuleType } from './layer-module/layer-modules';

export type WorkAreaLabel =
  | 'Ador'
  | 'Beambox'
  | 'Beambox II'
  | 'Beambox Pro'
  | 'beamo'
  | 'beamo II'
  | 'HEXA'
  | 'HEXA RF'
  | 'Lazervida'
  | 'Promark';

export const workArea = [
  'fbm1',
  'fbm2',
  'fbb1b',
  'fbb1p',
  'fhexa1',
  'fhx2rf4',
  'fhx2rf7',
  'ado1',
  'fpm1',
  'flv1',
  'fbb2',
] as const;
export type WorkAreaModel = (typeof workArea)[number];
export const workAreaSet = new Set(workArea);

const { dpmm } = constant;

export interface WorkArea {
  accOverride?: TAccelerationOverride;
  autoFocusOffset?: number[]; // [mm, mm]
  autoShrink?: number;
  calibrationCenter?: number[]; // [mm, mm]
  cameraCenter?: number[]; // [mm, mm]
  curveSpeedLimit?: number; // mm/s
  deep?: number; // mm
  dimensionCustomizable?: boolean;
  // extra displayHeight for modules
  displayHeight?: number; // mm
  height: number; // mm
  label: WorkAreaLabel;
  maxSpeed: number; // mm/s
  minPower?: number; // %
  minSpeed: number; // mm/s
  minSpeedWarning?: number; // mm/s
  pxDisplayHeight?: number; // px
  pxHeight: number; // px
  pxWidth: number; // px
  supportedModules?: LayerModuleType[];
  topExpansion?: number; // px
  vectorSpeedLimit?: number; // mm/s
  width: number; // mm
}

const hexaRfWorkAreaInfo: WorkArea = {
  accOverride: { path: { x: 1000, y: 1000 } },
  autoFocusOffset: [31.13, 1.2, 6.5],
  autoShrink: 0.05, // TODO: use same value as other machines, may need to adjust
  height: 410,
  label: 'HEXA RF',
  maxSpeed: 2000,
  minPower: 10,
  minSpeed: 0.5,
  minSpeedWarning: 3,
  pxHeight: 410 * dpmm,
  pxWidth: 740 * dpmm,
  vectorSpeedLimit: 20,
  width: 740,
};

export const workareaConstants: Record<WorkAreaModel, WorkArea> = {
  ado1: {
    accOverride: { path: { x: 500, y: 500 } },
    autoFocusOffset: [20.9, -40.38, 7.5],
    autoShrink: 0.05,
    cameraCenter: [215, 150],
    deep: 40.5,
    displayHeight: 320,
    height: 300,
    label: 'Ador',
    maxSpeed: 400,
    minPower: 10,
    minSpeed: 0.5,
    pxDisplayHeight: 320 * dpmm,
    pxHeight: 300 * dpmm,
    pxWidth: 430 * dpmm,
    supportedModules: [
      LayerModule.LASER_10W_DIODE,
      LayerModule.LASER_20W_DIODE,
      LayerModule.PRINTER,
      LayerModule.LASER_1064,
      LayerModule.UV_PRINT,
    ].filter(Boolean),
    vectorSpeedLimit: 20,
    width: 430,
  },
  fbb1b: {
    autoShrink: 0.05,
    height: 375,
    label: 'Beambox',
    maxSpeed: 300,
    minPower: 10,
    minSpeed: 0.5,
    minSpeedWarning: 3,
    pxHeight: 375 * dpmm,
    pxWidth: 400 * dpmm,
    vectorSpeedLimit: 20,
    width: 400,
  },
  fbb1p: {
    autoShrink: 0.05,
    height: 375,
    label: 'Beambox Pro',
    maxSpeed: 300,
    minPower: 10,
    minSpeed: 0.5,
    minSpeedWarning: 3,
    pxHeight: 375 * dpmm,
    pxWidth: 600 * dpmm,
    vectorSpeedLimit: 20,
    width: 600,
  },
  fbb2: {
    accOverride: { path: { x: 1000, y: 1000 } },
    autoFocusOffset: [28, 0, 0],
    autoShrink: 0.05,
    cameraCenter: [300, 150],
    curveSpeedLimit: 50,
    height: 375,
    label: 'Beambox II',
    maxSpeed: 900,
    minSpeed: 0.5,
    pxHeight: 375 * dpmm,
    pxWidth: 600 * dpmm,
    vectorSpeedLimit: 50,
    width: 600,
  },
  fbm1: {
    autoShrink: 0.05,
    height: 210,
    label: 'beamo',
    maxSpeed: 300,
    minPower: 10,
    minSpeed: 0.5,
    minSpeedWarning: 3,
    pxHeight: 210 * dpmm,
    pxWidth: 300 * dpmm,
    vectorSpeedLimit: 20,
    width: 300,
  },
  fbm2: {
    accOverride: { path: { x: 500, y: 500 } },
    autoShrink: 0.05, // TODO: use same value as other machines, may need to adjust
    calibrationCenter: [180, 50],
    cameraCenter: [180, 7],
    height: 240,
    label: 'beamo II',
    maxSpeed: 750,
    minSpeed: 0.5,
    pxHeight: 240 * dpmm,
    pxWidth: 360 * dpmm,
    supportedModules: [
      LayerModule.LASER_UNIVERSAL,
      LayerModule.PRINTER_4C,
      checkBM2UV() ? LayerModule.UV_WHITE_INK : null,
      checkBM2UV() ? LayerModule.UV_VARNISH : null,
      LayerModule.LASER_1064,
      LayerModule.UV_PRINT,
    ].filter(Boolean),
    topExpansion: 400,
    vectorSpeedLimit: 30,
    width: 360,
  },
  fhexa1: {
    autoFocusOffset: [31.13, 1.2, 6.5],
    autoShrink: 0.05,
    height: 410,
    label: 'HEXA',
    maxSpeed: 900,
    minPower: 10,
    minSpeed: 0.5,
    minSpeedWarning: 3,
    pxHeight: 410 * dpmm,
    pxWidth: 740 * dpmm,
    vectorSpeedLimit: 20,
    width: 740,
  },
  fhx2rf4: hexaRfWorkAreaInfo,
  fhx2rf7: hexaRfWorkAreaInfo,
  flv1: {
    height: 400,
    label: 'Lazervida',
    maxSpeed: 300,
    minSpeed: 1,
    pxHeight: 400 * dpmm,
    pxWidth: 400 * dpmm,
    vectorSpeedLimit: 20,
    width: 400,
  },
  fpm1: {
    dimensionCustomizable: true,
    height: 150,
    label: 'Promark',
    maxSpeed: 10000,
    minSpeed: 0.5,
    pxHeight: 150 * dpmm,
    pxWidth: 150 * dpmm,
    supportedModules: [LayerModule.LASER_UNIVERSAL],
    width: 150,
  },
};

export const getWorkarea = (model: WorkAreaModel, fallbackModel: WorkAreaModel = 'fbm1'): WorkArea => {
  const res = workareaConstants[model] || workareaConstants[fallbackModel];

  if (res.dimensionCustomizable) {
    const customizeDimension = beamboxPreference.read('customized-dimension');
    const { height = res.height, width = res.width } = customizeDimension[model] || {};

    return { ...res, height, pxHeight: height * dpmm, pxWidth: width * dpmm, width };
  }

  return { ...res };
};

export const getSupportedModules = (model: WorkAreaModel): LayerModuleType[] => {
  const { supportedModules = [LayerModule.LASER_UNIVERSAL, LayerModule.UV_PRINT] } = workareaConstants[model] ?? {};
  const isUvPrintEnabled = beamboxPreference.read('enable-uv-print-file');

  if (!isUvPrintEnabled) return supportedModules.filter((module) => module !== LayerModule.UV_PRINT);

  return supportedModules;
};

export default workareaConstants;
