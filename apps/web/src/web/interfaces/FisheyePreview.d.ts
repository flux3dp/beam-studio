import { IDeviceInfo } from './IDevice';

export interface FisheyeMatrix {
  k: number[][];
  d: number[][];
  points: [number, number][][];
  center?: [number, number];
}
/**
 * @deprecated
 * V1 is deprecated, used for fisheye camera with variable focal distance, saving perspective points for every height
 */
export interface FisheyeCameraParametersV1 {
  k: number[][];
  d: number[][];
  heights: number[];
  points: [number, number][][][];
  center: [number, number];
  z3regParam: number[][][][]; // [i][j][k][l] i: row, j: column, k: x/y, l: 3/2/1/0 th order;
}

/**
 * FisheyeCameraParametersV2Cali is calibrating data for V2
 * also saved rvec, tvec, dh1, dh2 for solvepnp
 */
export interface FisheyeCameraParametersV2Cali {
  source?: 'device' | 'user'; // k, d calibration source by device pictures or user input
  refHeight?: number;
  ret?: number;
  k?: number[][];
  d?: number[][];
  rvec?: number[];
  tvec?: number[];
  rvec_polyfit?: number[][];
  tvec_polyfit?: number[][];
  dh1?: number;
  dh2?: number;
  levelingData?: Record<string, number>;
  rvecs?: number[][];
  tvecs?: number[][];
  heights?: number[];
}

/**
 * FisheyeCameraParametersV2 is used for Ador or other variable focal disatance fisheye camera
 */
export interface FisheyeCameraParametersV2 {
  source?: 'device' | 'user'; // k, d calibration source by device pictures or user input
  refHeight: number;
  k: number[][];
  d: number[][];
  rvec: number[];
  tvec: number[];
  rvec_polyfit: number[][];
  tvec_polyfit: number[][];
  levelingData: Record<string, number>;
  v: 2;
}

/**
 * FisheyeCameraParametersV3 is used for BB2 or other fixed focal disatance fisheye camera
 */
export interface FisheyeCameraParametersV3 {
  k: number[][];
  d: number[][];
  rvec: number[];
  tvec: number[];
  rvecs?: number[][];
  tvecs?: number[][];
  v: 3;
}

export interface FisheyeCameraParametersV3Cali {
  ret?: number;
  k?: number[][];
  d?: number[][];
  rvec?: number[];
  tvec?: number[];
}

export interface PerspectiveGrid {
  x: [number, number, number]; // start, end, step
  y: [number, number, number]; // start, end, step
}

export type FisheyeCameraParameters = FisheyeCameraParametersV1 | FisheyeCameraParametersV2 | FisheyeCameraParametersV3;

export type FisheyeCaliParameters = FisheyeCameraParametersV2Cali | FisheyeCameraParametersV3Cali;

/**
 * @deprecated only used for V1, should be removed after all V1 camera is updated to V2
 * RotationParameters3D to save in the machine
 */
export interface RotationParameters3D {
  // rotation in 3 axes
  rx: number;
  ry: number;
  rz: number;
  // sh: Scale of h, since the dimension of the image is in pixel, the height when previewing is in mm,
  // we need the scale of h to convert the height in mm to pixel, the value is usually 6
  sh: number;
  // ch: constant of h, the distant from the top position of probe to the camera,
  // the value is usually 162mm in mechanical
  ch: number;
  // dh: the height deviation of the camera, would apply to preview height
  dh: number;
}

/**
 * @deprecated only used for V1, should be removed after all V1 camera is updated to V2
 * RotationParameters3D for calibration
 * add tx and ty to handle translation error
 * tx and ty will be saved in FisheyeMatrix center
 */
export interface RotationParameters3DCalibration extends RotationParameters3D {
  tx: number;
  ty: number;
}

/**
 * @deprecated only used for V1, should be removed after all V1 camera is updated to V2
 * RotationParameters3D for ghost api,
 * need to calculate h from sh, ch and object height
 */
export interface RotationParameters3DGhostApi {
  // rotation in 3 axes
  rx: number;
  ry: number;
  rz: number;
  h: number;
  tx: number;
  ty: number;
}

interface FisheyePreviewManagerBase {
  version: number;
  device: IDeviceInfo;
  params: FisheyeCameraParameters;
  objectHeight: number;
  levelingOffset: Record<string, number>;

  setupFisheyePreview(args?: { progressId?: string; }): Promise<boolean>;

  onObjectHeightChanged(): Promise<void>;

  resetObjectHeight(): Promise<boolean>;

  reloadLevelingOffset(): Promise<void>;
}

export interface FisheyePreviewManager {
  version: number;
  device: IDeviceInfo;
  params: FisheyeCameraParameters;
  support3dRotation: boolean;
  rotationData?: RotationParameters3DCalibration;
  objectHeight: number;
  levelingData: Record<string, number>;
  levelingOffset: Record<string, number>;

  setupFisheyePreview(args?: { progressId?: string; }): Promise<boolean>;

  update3DRotation?(newData: RotationParameters3DCalibration): Promise<void>;

  onObjectHeightChanged(): Promise<void>;

  resetObjectHeight(): Promise<boolean>;

  reloadLevelingOffset(): Promise<void>;
}
