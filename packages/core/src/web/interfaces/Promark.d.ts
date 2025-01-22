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
  offsetX: number;
  offsetY: number;
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
