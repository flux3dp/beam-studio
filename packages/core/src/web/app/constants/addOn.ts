import { checkBM2CurveEngraving } from '@core/helpers/checkFeature';
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
   * airAssist
   * if the model support setting air assist value by layer
   */
  airAssist?: boolean;
  /**
   * autoFeeder
   * xRange: [x, width] in mm, no limit is not set
   * vectorSpeedLimit: override vector speed in workarea constant when autoFeeder is enabled
   * minY: minimum Y position in px to avoid collision with extension rod
   */
  autoFeeder?: {
    maxHeight: number;
    minY?: number;
    rotaryRatio: number;
    vectorSpeedLimit?: number;
    xRange?: [number, number];
  };
  autoFocus?: boolean;
  /**
   * curveEngraving
   * non-null value means the model support curve engraving
   * acceleration means the value to override z-acceleration in fcode
   */
  curveEngraving?: { acceleration?: number };
  framingLowLaser?: boolean;
  hybridLaser?: boolean;
  jobOrigin?: boolean;
  lowerFocus?: boolean;
  multiModules?: boolean;
  openBottom?: boolean;
  /**
   * passThrough
   * xRange: [x, width] in mm, no limit is not set
   * minY: minimum Y position in px to avoid collision with extension rod
   * maxHeight: maximum height in mm for pass-through, make sure padding space is enough if with minY
   */
  passThrough?: { maxHeight: number; minY?: number; xRange?: [number, number] };
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
    airAssist: true,
    autoFeeder: {
      maxHeight: 3000,
      rotaryRatio: CHUCK_ROTARY_DIAMETER / FEEDER_DIAMETER / 2,
      vectorSpeedLimit: 30,
      xRange: [100, 400],
    },
    curveEngraving: {},
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
      extendWorkarea: true,
      mirror: false,
      roller: true,
    },
  },
  fbm2: {
    airAssist: true,
    autoFeeder: {
      maxHeight: 3000,
      minY: 200,
      rotaryRatio: CHUCK_ROTARY_DIAMETER / FEEDER_DIAMETER,
      vectorSpeedLimit: 30,
      xRange: [0, 340],
    },
    curveEngraving: checkBM2CurveEngraving() ? { acceleration: 1000 } : undefined,
    jobOrigin: true,
    lowerFocus: true,
    multiModules: true,
    passThrough: { maxHeight: 200, minY: 200, xRange: [0, 340] },
    redLight: true,
    rotary: {
      chuck: true,
      chuckDiameter: CHUCK_ROTARY_DIAMETER,
      defaultMirror: true,
      extendWorkarea: true,
      mirror: true,
      roller: true,
    },
  },
  fhexa1: {
    jobOrigin: true,
    lowerFocus: true,
    rotary: {
      chuck: true,
      extendWorkarea: false,
      mirror: false,
      roller: true,
    },
  },
  fhx2rf: {
    autoFeeder: isDev()
      ? {
          maxHeight: 3000,
          rotaryRatio: CHUCK_ROTARY_DIAMETER / FEEDER_DIAMETER / 2,
        }
      : undefined,
    jobOrigin: true,
    lowerFocus: true,
    rotary: {
      chuck: true,
      chuckDiameter: CHUCK_ROTARY_DIAMETER / 2,
      defaultMirror: true,
      extendWorkarea: true,
      mirror: true,
      roller: true,
    },
  },
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
