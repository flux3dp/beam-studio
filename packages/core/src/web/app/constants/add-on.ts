import { checkAdo1AutoFeeder, checkFbb2AutoFeeder, checkFbm1AutoFeeder } from '@core/helpers/checkFeature';

import type { WorkAreaModel } from './workarea-constants';

export enum RotaryType {
  Chuck = 2,
  Roller = 1,
}

export const CHUCK_ROTARY_DIAMETER = 133;
export const FBB2_FEEDER_DIAMETER = 167.08; // FIXME: This might be wrong due to PCB issue
export const FEEDER_DIAMETER = 83.54;

export interface AddOnInfo {
  autoFeeder?: { maxHeight: number; rotaryRatio: number; xRange?: [number, number] }; // [x, width] in mm, no limit is not set
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
    defaultMirror?: boolean;
    extendWorkarea: boolean;
    mirror: boolean;
    roller: boolean;
  };
}

const hexaSupportInfo: AddOnInfo = {
  jobOrigin: true,
  lowerFocus: true,
  rotary: {
    chuck: true,
    extendWorkarea: false,
    mirror: false,
    roller: true,
  },
};

const supportList: Record<WorkAreaModel, AddOnInfo> = {
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
    autoFeeder: checkFbb2AutoFeeder()
      ? { maxHeight: 2000, rotaryRatio: CHUCK_ROTARY_DIAMETER / FBB2_FEEDER_DIAMETER, xRange: [100, 400] }
      : undefined,
    curveEngraving: true,
    jobOrigin: true,
    lowerFocus: true,
    passThrough: { maxHeight: 300, xRange: [100, 400] },
    redLight: true,
    rotary: {
      chuck: true,
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
  fhexa1: hexaSupportInfo,
  fhx2rf3: hexaSupportInfo,
  fhx2rf6: hexaSupportInfo,
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
      chuck: false,
      extendWorkarea: false,
      mirror: false,
      roller: true,
    },
  },
};

export const getSupportInfo = (workarea: WorkAreaModel): AddOnInfo => supportList[workarea] || {};

export default {
  getSupportInfo,
  supportList,
};
