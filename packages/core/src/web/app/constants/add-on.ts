import type { WorkAreaModel } from './workarea-constants';

export enum RotaryType {
  Chuck = 2,
  Roller = 1,
}

export const CHUCK_ROTARY_DIAMETER = 133;

export interface SupportInfo {
  autoFeeder?: { maxHeight: number; xRange: [number, number] }; // [x, width] in mm
  autoFocus?: boolean;
  curveEngraving?: boolean;
  framingLowLaser?: boolean;
  hybridLaser?: boolean;
  jobOrigin?: boolean;
  lowerFocus?: boolean;
  openBottom?: boolean;
  passThrough?: boolean;
  redLight?: boolean;
  rotary?: {
    chuck: boolean;
    defaultMirror?: boolean;
    extendWorkarea: boolean;
    mirror: boolean;
    roller: boolean;
  };
}

const supportList: Record<WorkAreaModel, SupportInfo> = {
  ado1: {
    framingLowLaser: true,
    jobOrigin: true,
    lowerFocus: true,
    passThrough: true,
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
    autoFeeder: { maxHeight: 2000, xRange: [100, 400] },
    curveEngraving: true,
    jobOrigin: true,
    lowerFocus: true,
    passThrough: false, // TODO: hide until fix job origin for clipped object
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
    autoFocus: true,
    hybridLaser: true,
    jobOrigin: true,
    openBottom: true,
    passThrough: true,
    rotary: {
      chuck: true,
      extendWorkarea: false,
      mirror: false,
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

export const getSupportInfo = (workarea: WorkAreaModel): SupportInfo => supportList[workarea] || {};

export default {
  getSupportInfo,
  supportList,
};
