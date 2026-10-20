import type { LaserType, mopaWatts, promarkWatts, uvWatts } from '@core/app/constants/promark-constants';
import type { FisheyeCameraParametersV3 } from '@core/interfaces/FisheyePreview';

export type PromarkInfo =
  | {
      laserType: LaserType.Desktop;
      watt: (typeof promarkWatts)[number];
    }
  | {
      laserType: LaserType.MOPA;
      watt: (typeof mopaWatts)[number];
    }
  | {
      laserType: LaserType.UV;
      watt: (typeof uvWatts)[number];
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

export interface PromarkCameraParameters extends FisheyeCameraParametersV3 {
  /** Whether webcam frames are rotated 180° before use; absent in parameters saved before it existed */
  rotate180?: boolean;
}

/** Identifies a field lens: its work area and whether it is used for inner engraving. */
export interface LensProfileKey {
  innerEngraving: boolean;
  /** mm */
  workarea: number;
}

export interface LensProfile extends LensProfileKey {
  field?: Field;
  galvoParameters?: GalvoParameters;
  redDot?: RedDot;
}

export interface PromarkStore {
  cameraDeviceId?: string;
  cameraParameters?: PromarkCameraParameters;
  /** at most one profile is the default; the legacy set is kept as a copy of it */
  defaultLensProfile?: LensProfileKey;
  /** legacy set, saved without a work area; used when neither a matching nor a default profile exists */
  field?: Field;
  /** legacy set, see `field` */
  galvoParameters?: GalvoParameters;
  info?: PromarkInfo;
  lensProfiles?: LensProfile[];
  /** legacy set, see `field` */
  redDot?: RedDot;
}

export interface ButtonState {
  isFraming?: boolean;
  isRunning?: boolean;
  pressed: boolean;
}
