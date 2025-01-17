import beamboxPreference from 'app/actions/beambox/beambox-preference';
import constant from 'app/actions/beambox/constant';

export type WorkAreaLabel =
  | 'beamo'
  | 'Beambox'
  | 'Beambox Pro'
  | 'HEXA'
  | 'Ador'
  | 'Promark'
  | 'Lazervida'
  | 'Beambox II';
export type WorkAreaModel =
  | 'fbm1'
  | 'fbb1b'
  | 'fbb1p'
  | 'fhexa1'
  | 'ado1'
  | 'fpm1'
  | 'flv1'
  | 'fbb2';
export const allWorkareas = new Set([
  'fbm1',
  'fbb1b',
  'fbb1p',
  'fhexa1',
  'ado1',
  'fpm1',
  'flv1',
  'fbb2',
]);

const { dpmm } = constant;
export interface WorkArea {
  label: WorkAreaLabel;
  width: number; // mm
  pxWidth: number; // px
  height: number; // mm
  pxHeight: number; // px
  dismensionCustomizable?: boolean;
  // extra displayHeight for modules
  displayHeight?: number; // mm
  pxDisplayHeight?: number; // px
  deep?: number; // mm
  maxSpeed: number; // mm/s
  minSpeed: number; // mm/s
  minPower?: number; // %
  vectorSpeedLimit?: number; // mm/s
  cameraCenter?: number[]; // [mm, mm]
  autoFocusOffset?: number[]; // [mm, mm]
  passThroughMaxHeight?: number; // mm
}

const workareaConstants: { [key in WorkAreaModel]: WorkArea } = {
  fbm1: {
    label: 'beamo',
    width: 300,
    pxWidth: 300 * dpmm,
    height: 210,
    pxHeight: 210 * dpmm,
    maxSpeed: 300,
    minSpeed: 0.5,
    minPower: 10,
    vectorSpeedLimit: 20,
  },
  fbb1b: {
    label: 'Beambox',
    width: 400,
    pxWidth: 400 * dpmm,
    height: 375,
    pxHeight: 375 * dpmm,
    maxSpeed: 300,
    minSpeed: 0.5,
    minPower: 10,
    vectorSpeedLimit: 20,
  },
  fbb1p: {
    label: 'Beambox Pro',
    width: 600,
    pxWidth: 600 * dpmm,
    height: 375,
    pxHeight: 375 * dpmm,
    maxSpeed: 300,
    minSpeed: 0.5,
    minPower: 10,
    vectorSpeedLimit: 20,
  },
  fhexa1: {
    label: 'HEXA',
    width: 740,
    pxWidth: 740 * dpmm,
    height: 410,
    pxHeight: 410 * dpmm,
    maxSpeed: 900,
    minSpeed: 0.5,
    minPower: 10,
    vectorSpeedLimit: 20,
    autoFocusOffset: [31.13, 1.2, 6.5],
  },
  ado1: {
    label: 'Ador',
    width: 430,
    pxWidth: 430 * dpmm,
    height: 300,
    pxHeight: 300 * dpmm,
    displayHeight: 320,
    pxDisplayHeight: 320 * dpmm,
    deep: 40.5,
    maxSpeed: 400,
    minSpeed: 0.5,
    minPower: 10,
    vectorSpeedLimit: 20,
    cameraCenter: [215, 150],
    autoFocusOffset: [20.9, -40.38, 7.5],
    passThroughMaxHeight: 240,
  },
  fpm1: {
    label: 'Promark',
    width: 150,
    pxWidth: 150 * dpmm,
    height: 150,
    pxHeight: 150 * dpmm,
    dismensionCustomizable: true,
    maxSpeed: 10000,
    minSpeed: 0.5,
  },
  flv1: {
    label: 'Lazervida',
    width: 400,
    pxWidth: 400 * dpmm,
    height: 400,
    pxHeight: 400 * dpmm,
    maxSpeed: 300,
    minSpeed: 1,
    vectorSpeedLimit: 20,
  },
  fbb2: {
    label: 'Beambox II',
    width: 600,
    pxWidth: 600 * dpmm,
    height: 375,
    pxHeight: 375 * dpmm,
    maxSpeed: 900,
    minSpeed: 0.5,
    vectorSpeedLimit: 50,
    cameraCenter: [300, 150],
    autoFocusOffset: [28, 0, 0],
    passThroughMaxHeight: 360,
  },
};

export const getWorkarea = (
  model: WorkAreaModel,
  fallbackModel: WorkAreaModel = 'fbm1'
): WorkArea => {
  const res = workareaConstants[model] || workareaConstants[fallbackModel];
  if (res.dismensionCustomizable) {
    const customizeDimension = beamboxPreference.read('customized-dimension') ?? {};
    const { width = res.width, height = res.height } = customizeDimension[model] || {};
    return { ...res, width, height, pxWidth: width * dpmm, pxHeight: height * dpmm };
  }
  return { ...res };
};

export default workareaConstants;
