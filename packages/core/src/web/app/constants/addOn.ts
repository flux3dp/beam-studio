import isDev from '@core/helpers/is-dev';

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

const hexaRfAddOnInfo: AddOnInfo = {
  ...hexaAddOnInfo,
  autoFeeder: isDev()
    ? {
        maxHeight: 3000,
        rotaryRatio: CHUCK_ROTARY_DIAMETER / FEEDER_DIAMETER / 2,
      }
    : undefined,
};

const addOnData: Record<WorkAreaModel, AddOnInfo> = {
  ado1: {
    autoFeeder: { maxHeight: 2000, rotaryRatio: CHUCK_ROTARY_DIAMETER / FEEDER_DIAMETER },
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
      rotaryRatio: CHUCK_ROTARY_DIAMETER / FEEDER_DIAMETER / 2,
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
    autoFeeder: { maxHeight: 2000, rotaryRatio: -CHUCK_ROTARY_DIAMETER / FEEDER_DIAMETER },
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
  fhx2rf3: hexaRfAddOnInfo,
  fhx2rf6: hexaRfAddOnInfo,
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
