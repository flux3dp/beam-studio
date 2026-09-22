import type { LaserType, mopaWatts, promarkWatts } from '@core/app/constants/promark-constants';
import type { FisheyeCameraParametersV3 } from '@core/interfaces/FisheyePreview';

export type PromarkInfo =
  | {
      laserType: LaserType.Desktop;
      watt: (typeof promarkWatts)[number];
    }
  | {
      laserType: LaserType.MOPA;
      watt: (typeof mopaWatts)[number];
    };

export interface Field {
  angle: number;
  /**
   * Axis orientation of a galvo scan head, stored alongside the rest of the field. Optional
   * because only the HEXA II galvo heads carry them -- Promark's firmware has no such setting.
   */
  invertX?: boolean;
  invertY?: boolean;
  offsetX: number;
  offsetY: number;
  swapXY?: boolean;
}

export interface RedDot {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
}

export interface LensCorrection {
  bulge: number;
  scale: number;
  skew: number;
  trapezoid: number;
}

export interface GalvoParameters {
  x: LensCorrection;
  y: LensCorrection;
}

export interface PromarkStore {
  cameraDeviceId?: string;
  cameraParameters?: FisheyeCameraParametersV3;
  field?: Field;
  galvoParameters?: GalvoParameters;
  info?: PromarkInfo;
  redDot?: RedDot;
}

export interface ButtonState {
  isFraming?: boolean;
  isRunning?: boolean;
  pressed: boolean;
}
