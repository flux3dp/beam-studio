import { checkAdo1AutoFeeder, checkFbm1AutoFeeder } from '@core/helpers/checkFeature';

import type { WorkAreaModel } from './workarea-constants';

export enum RotaryType {
  Chuck = 2,
  Roller = 1,
}

export const CHUCK_ROTARY_DIAMETER = 133;
export const FEEDER_DIAMETER = 83.54;

export interface AddOnInfo {
  /**
   * autoFeeder
   * range: [x, width] in mm, no limit is not set
   * vectorSpeedLimit: override vector speed in workarea constant when autoFeeder is enabled
   */
  autoFeeder?: { maxHeight: number; rotaryRatio: number; vectorSpeedLimit?: number; xRange?: [number, number] };
  autoFocus?: boolean;
  curveEngraving?: boolean;
  framingLowLaser?: boolean;
  hybridLaser?: boolean;
  jobOrigin?: boolean;
  lowerFocus?: boolean;
  openBottom?: boolean;
  passThrough?: { maxHeight: number; xRange?: [number, number] }; // [x, width] in mm, no limit is not set
  redLight?: boolean;
  rotary?: {
    chuck: boolean;
    chuckDiameter?: number;
    defaultMirror?: boolean;
    extendWorkarea: boolean;
    mirror: boolean;
    roller: boolean;
    split?: boolean;
  };
}

const hexaAddOnInfo: AddOnInfo = {
  jobOrigin: true,
  lowerFocus: true,
  rotary: {
    chuck: true,
    extendWorkarea: false,
    mirror: false,
    roller: true,
  },
};

const addOnData: Record<WorkAreaModel, AddOnInfo> = {
  ado1: {
    autoFeeder: checkAdo1AutoFeeder()
      ? { maxHeight: 2000, rotaryRatio: CHUCK_ROTARY_DIAMETER / FEEDER_DIAMETER }
      : undefined,
    framingLowLaser: true,
    jobOrigin: true,
    lowerFocus: true,
    passThrough: { maxHeight: 240 },
    rotary: {
      chuck: true,
      defaultMirror: true,
      extendWorkarea: true,
      mirror: true,
      roller: true,
    },
  },
  fbb1b: {
    jobOrigin: true,
    rotary: {
      chuck: false,
      extendWorkarea: false,
      mirror: false,
      roller: true,
    },
  },
  fbb1p: {
    jobOrigin: true,
    rotary: {
      chuck: false,
      extendWorkarea: false,
      mirror: false,
      roller: true,
    },
  },
  fbb2: {
    autoFeeder: {
      maxHeight: 3000,
      rotaryRatio: CHUCK_ROTARY_DIAMETER / FEEDER_DIAMETER,
      vectorSpeedLimit: 30,
      xRange: [100, 400],
    },
    curveEngraving: true,
    jobOrigin: true,
    lowerFocus: true,
    passThrough: { maxHeight: 300, xRange: [100, 400] },
    redLight: true,
    rotary: {
      chuck: true,
      chuckDiameter: CHUCK_ROTARY_DIAMETER / 2,
      defaultMirror: true,
      extendWorkarea: true,
      mirror: true,
      roller: true,
    },
  },
  fbm1: {
    autoFeeder: checkFbm1AutoFeeder()
      ? { maxHeight: 2000, rotaryRatio: -CHUCK_ROTARY_DIAMETER / FEEDER_DIAMETER }
      : undefined,
    autoFocus: true,
    hybridLaser: true,
    jobOrigin: true,
    openBottom: true,
    passThrough: { maxHeight: 160 },
    rotary: {
      chuck: true,
      extendWorkarea: false,
      mirror: false,
      roller: true,
    },
  },
  fhexa1: hexaAddOnInfo,
  fhx2rf3: hexaAddOnInfo,
  fhx2rf6: hexaAddOnInfo,
  flv1: {
    jobOrigin: true,
    rotary: {
      chuck: false,
      extendWorkarea: false,
      mirror: false,
      roller: true,
    },
  },
  fpm1: {
    lowerFocus: true,
    rotary: {
      chuck: true,
      extendWorkarea: true,
      mirror: true,
      roller: true,
      split: true,
    },
  },
};

export const getAddOnInfo = (workarea: WorkAreaModel): AddOnInfo => addOnData[workarea] || {};

export default {
  getAddOnInfo,
};
