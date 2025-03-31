import type { IDeviceInfo } from './IDevice';

export interface FisheyeMatrix {
  center?: [number, number];
  d: number[][];
  k: number[][];
  points: Array<Array<[number, number]>>;
}
/**
 * @deprecated
 * V1 is deprecated, used for fisheye camera with variable focal distance, saving perspective points for every height
 */
export interface FisheyeCameraParametersV1 {
  center: [number, number];
  d: number[][];
  heights: number[];
  k: number[][];
  points: Array<Array<Array<[number, number]>>>;
  z3regParam: number[][][][]; // [i][j][k][l] i: row, j: column, k: x/y, l: 3/2/1/0 th order;
}

/**
 * FisheyeCameraParametersV2Cali is calibrating data for V2
 * also saved rvec, tvec, dh1, dh2 for solvepnp
 */
export interface FisheyeCameraParametersV2Cali {
  d?: number[][];
  dh1?: number;
  dh2?: number;
  heights?: number[];
  k?: number[][];
  levelingData?: Record<string, number>;
  refHeight?: number;
  ret?: number;
  rvec?: number[];
  rvec_polyfit?: number[][];
  rvecs?: number[][];
  source?: 'device' | 'user'; // k, d calibration source by device pictures or user input
  tvec?: number[];
  tvec_polyfit?: number[][];
  tvecs?: number[][];
}

/**
 * FisheyeCameraParametersV2 is used for Ador or other variable focal disatance fisheye camera
 */
export interface FisheyeCameraParametersV2 {
  d: number[][];
  k: number[][];
  levelingData?: Record<string, number>;
  refHeight: number;
  rvec: number[];
  rvec_polyfit: number[][];
  source?: 'device' | 'user'; // k, d calibration source by device pictures or user input
  tvec: number[];
  tvec_polyfit: number[][];
  v: 2;
}

/**
 * FisheyeCameraParametersV3 is used for BB2 or other fixed focal disatance fisheye camera
 */
export interface FisheyeCameraParametersV3 {
  d: number[][];
  k: number[][];
  rvec: number[];
  rvecs?: number[][];
  tvec: number[];
  tvecs?: number[][];
  v: 3;
}

export interface FisheyeCameraParametersV3Cali {
  d?: number[][];
  k?: number[][];
  ret?: number;
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
  // ch: constant of h, the distant from the top position of probe to the camera,
  // the value is usually 162mm in mechanical
  ch: number;
  // dh: the height deviation of the camera, would apply to preview height
  dh: number;
  // rotation in 3 axes
  rx: number;
  ry: number;
  rz: number;
  // sh: Scale of h, since the dimension of the image is in pixel, the height when previewing is in mm,
  // we need the scale of h to convert the height in mm to pixel, the value is usually 6
  sh: number;
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
  h: number;
  // rotation in 3 axes
  rx: number;
  ry: number;
  rz: number;
  tx: number;
  ty: number;
}

interface FisheyePreviewManagerBase {
  device: IDeviceInfo;
  levelingOffset: Record<string, number>;
  objectHeight: number;
  onObjectHeightChanged(): Promise<void>;
  params: FisheyeCameraParameters;

  reloadLevelingOffset(): Promise<void>;

  resetObjectHeight(): Promise<boolean>;

  setupFisheyePreview(args?: { progressId?: string }): Promise<boolean>;

  version: number;
}

export interface FisheyePreviewManager {
  device: IDeviceInfo;
  levelingData: Record<string, number>;
  levelingOffset: Record<string, number>;
  objectHeight: number;
  onObjectHeightChanged(): Promise<void>;
  params: FisheyeCameraParameters;
  reloadLevelingOffset(): Promise<void>;
  resetObjectHeight(): Promise<boolean>;

  rotationData?: RotationParameters3DCalibration;

  setupFisheyePreview(args?: { progressId?: string }): Promise<boolean>;

  support3dRotation: boolean;

  update3DRotation?(newData: RotationParameters3DCalibration): Promise<void>;

  version: number;
}
