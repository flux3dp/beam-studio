import type { WorkAreaModel } from './workarea-constants';

export enum RotaryType {
  Chuck = 2,
  Roller = 1,
}

export const CHUCK_ROTARY_DIAMETER = 133;

export interface SupportInfo {
  autoFocus: boolean;
  framingLowLaser?: boolean;
  hybridLaser: boolean;
  jobOrigin?: boolean;
  lowerFocus: boolean;
  openBottom: boolean;
  passThrough: boolean;
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
    autoFocus: false,
    framingLowLaser: true,
    hybridLaser: false,
    jobOrigin: true,
    lowerFocus: true,
    openBottom: false,
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
    autoFocus: false,
    hybridLaser: false,
    jobOrigin: true,
    lowerFocus: false,
    openBottom: false,
    passThrough: false,
    rotary: {
      chuck: false,
      extendWorkarea: false,
      mirror: false,
      roller: true,
    },
  },
  fbb1p: {
    autoFocus: false,
    hybridLaser: false,
    jobOrigin: true,
    lowerFocus: false,
    openBottom: false,
    passThrough: false,
    rotary: {
      chuck: false,
      extendWorkarea: false,
      mirror: false,
      roller: true,
    },
  },
  fbb2: {
    autoFocus: false,
    hybridLaser: false,
    jobOrigin: true,
    lowerFocus: true,
    openBottom: false,
    passThrough: true,
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
    lowerFocus: false,
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
    autoFocus: false,
    hybridLaser: false,
    jobOrigin: true,
    lowerFocus: true,
    openBottom: false,
    passThrough: false,
    rotary: {
      chuck: true,
      extendWorkarea: false,
      mirror: false,
      roller: true,
    },
  },
  flv1: {
    autoFocus: false,
    hybridLaser: false,
    jobOrigin: true,
    lowerFocus: false,
    openBottom: false,
    passThrough: false,
    rotary: {
      chuck: false,
      extendWorkarea: false,
      mirror: false,
      roller: true,
    },
  },
  fpm1: {
    autoFocus: false,
    hybridLaser: false,
    lowerFocus: true,
    openBottom: false,
    passThrough: false,
    rotary: {
      chuck: false,
      extendWorkarea: false,
      mirror: false,
      roller: true,
    },
  },
};

export const getSupportInfo = (workarea: WorkAreaModel): SupportInfo =>
  supportList[workarea] || {
    autoFocus: false,
    hybridLaser: false,
    lowerFocus: false,
    openBottom: false,
    passThrough: false,
  };

export default {
  getSupportInfo,
  supportList,
};
