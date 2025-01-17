import { FisheyeCameraParametersV3 } from 'interfaces/FisheyePreview';
import { LaserType, mopaWatts, promarkWatts } from 'app/constants/promark-constants';

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
  offsetX: number;
  offsetY: number;
  angle: number;
}

export interface RedDot {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
}

export interface LensCorrection {
  scale: number;
  bulge: number;
  skew: number;
  trapezoid: number;
}

export interface GalvoParameters {
  x: LensCorrection;
  y: LensCorrection;
}

export interface PromarkStore {
  info?: PromarkInfo;
  field?: Field;
  redDot?: RedDot;
  cameraParameters?: FisheyeCameraParametersV3;
  cameraDeviceId?: string;
  galvoParameters?: GalvoParameters;
}

export interface ButtonState {
  pressed: boolean;
  isRunning?: boolean;
  isFraming?: boolean;
}
