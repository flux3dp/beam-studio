import type { IDeviceInfo } from './IDevice';

// TODO: rename fisheye name prefix to camera name prefix since we have pinhole camera now

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
  is_fisheye?: boolean;
  k?: number[][];
  levelingData?: Record<string, number>;
  refHeight?: number;
  ret?: number;
  rvec?: number[][];
  rvec_polyfit?: number[][];
  rvecs?: number[][][];
  source?: 'device' | 'user'; // k, d calibration source by device pictures or user input
  tvec?: number[][];
  tvec_polyfit?: number[][];
  tvecs?: number[][][];
}

/**
 * FisheyeCameraParametersV2 is used for Ador or other variable focal distance fisheye camera
 */
export interface FisheyeCameraParametersV2 {
  d: number[][];
  is_fisheye?: boolean;
  k: number[][];
  levelingData?: Record<string, number>;
  refHeight: number;
  rvec: number[][];
  rvec_polyfit: number[][];
  source?: 'device' | 'user'; // k, d calibration source by device pictures or user input
  tvec: number[][];
  tvec_polyfit: number[][];
  v: 2;
}

/**
 * FisheyeCameraParametersV3 is used for BB2 or other fixed focal distance fisheye camera
 */
export interface FisheyeCameraParametersV3 {
  d: number[][];
  is_fisheye?: boolean;
  k: number[][];
  rvec: number[][];
  rvecs?: number[][][];
  tvec: number[][];
  tvecs?: number[][][];
  v: 3;
}

export interface FisheyeCameraParametersV3Cali {
  d?: number[][];
  is_fisheye?: boolean;
  k?: number[][];
  ret?: number;
  rvec?: number[][];
  tvec?: number[][];
}

export type WideAngleRegion =
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight'
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'topLeft'
  | 'topRight';

/**
 * FisheyeCameraParametersV4
 * pretty like V2 that requires 2 different heights and use polyfit to calculate the rvec and tvec
 * but V4 is used for larger region, so we need to calibrate and save the polyfit for each region
 * when previewing, we need to calculate the rvec and tvec for each region and splice the image of different region
 * and then combine them to a single image
 */
export interface FisheyeCameraParametersV4<Region = WideAngleRegion> {
  d: number[][];
  grids?: PerspectiveGrid;
  is_fisheye?: boolean;
  k: number[][];
  ret?: number;
  rvec: number[][];
  rvec_polyfits: Record<Region, number[][]>;
  tvec: number[][];
  tvec_polyfits: Record<Region, number[][]>;
  v: 4;
}

export interface FisheyeCameraParametersV4Cali<Region = WideAngleRegion> {
  d?: number[][];
  dh1?: number;
  dh2?: number;
  /**
   * imgPoints1 saved region image points during solvepnp in 1st height
   */
  imgPoints1?: Partial<Record<Region, Array<[number, number]>>>;
  /**
   * imgPoints2 saved region image points during solvepnp in 2nd height
   */
  imgPoints2?: Partial<Record<Region, Array<[number, number]>>>;
  is_fisheye?: boolean;
  k?: number[][];
  ret?: number;
  /**
   * rvec and tvec are used for solvepnp to guess the initial points
   */
  rvec?: number[][];
  /**
   * rvecs1: saved region rvec for each region in 1st height
   */
  rvecs1?: Partial<Record<Region, number[][]>>;
  /**
   * rvecs2: saved region rvec for each region in 2nd height
   */
  rvecs2?: Partial<Record<Region, number[][]>>;
  /**
   * rvec and tvec are used for solvepnp to guess the initial points
   */
  tvec?: number[][];
  /**
   * tvecs1: saved region tvec for each region in 1st height
   */
  tvecs1?: Partial<Record<Region, number[][]>>;
  /**
   * rvecs2: saved region rvec for each region in 2nd height
   */
  tvecs2?: Partial<Record<Region, number[][]>>;
}
/**
 * PerspectiveGrid is used the generate grid points for perspective transformation
 * x: [start, end, step]
 * y: [start, end, step]
 */
export interface PerspectiveGrid {
  x: [number, number, number];
  y: [number, number, number];
}

export type FisheyeCameraParameters<T = any> =
  | FisheyeCameraParametersV1
  | FisheyeCameraParametersV2
  | FisheyeCameraParametersV3
  | FisheyeCameraParametersV4<T>;

export type FisheyeCaliParameters<T = any> =
  | FisheyeCameraParametersV2Cali
  | FisheyeCameraParametersV3Cali
  | FisheyeCameraParametersV4Cali<T>;

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

  setupFisheyePreview(args?: {
    closeMessage?: () => void;
    updateMessage?: (message: string) => void;
  }): Promise<boolean>;

  support3dRotation: boolean;

  update3DRotation?(newData: RotationParameters3DCalibration): Promise<void>;

  version: number;
}
