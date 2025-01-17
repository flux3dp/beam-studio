import Constant from 'app/actions/beambox/constant';
import CameraCalibrationApi from 'helpers/api/camera-calibration';
import deviceMaster from 'helpers/device-master';
import i18n from 'helpers/i18n';
import VersionChecker from 'helpers/version-checker';
import { CameraConfig } from 'interfaces/Camera';
import {
  CALIBRATION_PARAMS,
  DEFAULT_CAMERA_OFFSET,
} from 'app/constants/camera-calibration-constants';
import {
  FisheyeCaliParameters,
  FisheyeCameraParameters,
  FisheyeCameraParametersV2Cali,
} from 'interfaces/FisheyePreview';
import { IDeviceInfo } from 'interfaces/IDevice';

const api = new CameraCalibrationApi();

const doAnalyzeResult = async (
  imgBlobUrl: string,
  x: number,
  y: number,
  angle: number,
  squareWidth: number,
  squareHeight: number
): Promise<CameraConfig | null> => {
  const blobImgSize = await new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.src = imgBlobUrl;
    img.onload = () => {
      console.log('Blob size', img.width, img.height);
      resolve({
        width: img.width,
        height: img.height,
      });
    };
  });

  const { idealScaleRatio } = CALIBRATION_PARAMS;
  const squareSize = Constant.camera.calibrationPicture.size;

  const scaleRatioX = (squareSize * Constant.dpmm) / squareWidth;
  const scaleRatioY = (squareSize * Constant.dpmm) / squareHeight;
  const deviationX = x - blobImgSize.width / 2;
  const deviationY = y - blobImgSize.height / 2;

  const offsetX = -(deviationX * scaleRatioX) / Constant.dpmm + CALIBRATION_PARAMS.idealOffsetX;
  const offsetY = -(deviationY * scaleRatioY) / Constant.dpmm + CALIBRATION_PARAMS.idealOffsetY;

  if (scaleRatioX / idealScaleRatio < 0.8 || scaleRatioX / idealScaleRatio > 1.2) {
    return null;
  }
  if (scaleRatioY / idealScaleRatio < 0.8 || scaleRatioY / idealScaleRatio > 1.2) {
    return null;
  }
  if (Math.abs(deviationX) > 400 || Math.abs(deviationY) > 400) {
    return null;
  }
  if (Math.abs(angle) > (10 * Math.PI) / 180) {
    return null;
  }
  return {
    X: offsetX,
    Y: offsetY,
    R: -angle,
    SX: scaleRatioX,
    SY: scaleRatioY,
  };
};

export const doSendPictureTask = async (imgBlobUrl: string): Promise<CameraConfig | null> => {
  const d = $.Deferred();
  fetch(imgBlobUrl)
    .then((res) => res.blob())
    .then((blob) => {
      const fileReader = new FileReader();
      fileReader.onloadend = async (e) => {
        try {
          const resp = await api.upload(e.target.result as ArrayBuffer);
          d.resolve(resp);
        } catch (resp) {
          d.reject(resp.toString());
        }
      };
      fileReader.readAsArrayBuffer(blob);
    })
    .catch((err) => {
      d.reject(err);
    });

  const resp = await d.promise();
  const { status, x, y, angle, width, height } = resp;
  let result = null;
  switch (status) {
    case 'ok':
      result = await doAnalyzeResult(imgBlobUrl, x, y, angle, width, height);
      break;
    case 'fail':
    case 'none':
    default:
      break;
  }
  return result;
};

export const doGetOffsetFromPicture = async (
  imgBlobUrl: string,
  setCurrentOffset: (offset: CameraConfig) => void
): Promise<boolean> => {
  const offset = await doSendPictureTask(imgBlobUrl);
  if (!offset) {
    setCurrentOffset(DEFAULT_CAMERA_OFFSET);
    return false;
  }
  setCurrentOffset(offset);
  return true;
};

const doSetConfigTask = async (device, data: CameraConfig, borderless) => {
  const { X, Y, R, SX, SY } = data;
  const parameterName = borderless ? 'camera_offset_borderless' : 'camera_offset';
  const vc = VersionChecker(device.version);
  if (vc.meetRequirement('BEAMBOX_CAMERA_CALIBRATION_XY_RATIO')) {
    await deviceMaster.setDeviceSetting(
      parameterName,
      `Y:${Y} X:${X} R:${R} S:${(SX + SY) / 2} SX:${SX} SY:${SY}`
    );
  } else {
    await deviceMaster.setDeviceSetting(parameterName, `Y:${Y} X:${X} R:${R} S:${(SX + SY) / 2}`);
  }
};

export const sendPictureThenSetConfig = async (
  result: CameraConfig,
  device: IDeviceInfo,
  borderless: boolean
): Promise<void> => {
  console.log('Setting camera_offset', borderless ? 'borderless' : '', result);
  if (result) {
    await doSetConfigTask(
      device,
      {
        ...result,
        X: Math.round(result.X * 10) / 10,
        Y: Math.round(result.Y * 10) / 10,
      },
      borderless
    );
  } else {
    throw new Error(i18n.lang.calibration.analyze_result_fail);
  }
};

export const startFisheyeCalibrate = (): Promise<boolean> => api.startFisheyeCalibrate();
export const addFisheyeCalibrateImg = (height: number, imgBlob: Blob): Promise<boolean> =>
  api.addFisheyeCalibrateImg(height, imgBlob);
export const doFishEyeCalibration = (
  onProgress?: (val: number) => void
): Promise<FisheyeCameraParametersV2Cali> => api.doFisheyeCalibration(onProgress);

export const setFisheyeConfig = async (
  data: FisheyeCameraParameters
): Promise<{ status: string }> => {
  const strData = JSON.stringify(data, (key, val) => {
    if (typeof val === 'number') {
      return Math.round(val * 1e6) / 1e6;
    }
    return val;
  });
  const res = await deviceMaster.uploadFisheyeParams(strData, () => {});
  return res;
};

const interpolateValue = (p1: number, v1: number[], p2: number, v2: number[], p: number) => {
  const r1 = (p - p1) / (p2 - p1);
  const r2 = (p2 - p) / (p2 - p1);
  const result = [...v1];
  for (let i = 0; i < v1.length; i += 1) {
    result[i] = v1[i] * r2 + v2[i] * r1;
  }
  return result;
};

const binarySearchFindHeightIndex = (heights: number[], height: number): number => {
  let left = 0;
  // Because we need to use index + 1, so the max index is heights.length - 2
  let right = heights.length - 2;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (heights[mid] <= height) {
      result = mid; // Update result and continue searching in the right half
      left = mid + 1;
    } else {
      right = mid - 1; // Search in the left half
    }
  }
  return result > -1 ? result : 0;
};

/**
 * Using the split indices and chessboard size to calculate the index of each split in chessboard
 * @param split the split of chessboard in x and y direction, [splitX, splitY]
 * @param chessboard the dimension of chessboard
 * @returns the index of each split in chessboard, shape should be [splitX + 1, splitY + 1, 2]
 */
const getAllSplitIndices = (split: number[], chessboard: number[]): number[][][] => {
  const [splitX, splitY] = split;
  const result: number[][][] = [];
  for (let i = 0; i < splitX + 1; i += 1) {
    result.push([]);
    for (let j = 0; j < splitY + 1; j += 1) {
      result[i].push([
        Math.min(Math.floor((i * chessboard[0]) / splitX), chessboard[0] - 1),
        Math.min(Math.floor((j * chessboard[1]) / splitY), chessboard[1] - 1),
      ]);
    }
  }
  return result;
};

/**
 * using the split indices and chessboard size to calculate the real position of each split
 * @param split the split of chessboard
 * @param chessboard the dimension of chessboard
 * @param workarea the dimension of workarea in mm
 * @param center the workarea center of perspective transformed image, mapping the image dimension to workarea dimension
 * @returns number[][][] the real position of each split
 */
const getRealPositionOfSplitIndices = (
  split: number[],
  chessboard: number[],
  workarea: number[],
  center: number[]
): number[][][] => {
  const dpmm = 5;
  const padding = 100;
  const allIndices = getAllSplitIndices(split, chessboard);
  // center in pixel
  const [centerX, centerY] = center;
  const [w, h] = workarea;
  const centerRealX = w / 2;
  const centerRealY = h / 2;
  const result: number[][][] = [];
  for (let i = 0; i < allIndices.length; i += 1) {
    result.push([]);
    for (let j = 0; j < allIndices[i].length; j += 1) {
      const [x, y] = allIndices[i][j];
      const pixelX = padding + x * 10 * dpmm;
      const pixelY = padding + y * 10 * dpmm;
      const realX = (pixelX - centerX) / dpmm + centerRealX;
      const realY = (pixelY - centerY) / dpmm + centerRealY;
      result[i].push([realX, realY]);
    }
  }
  return result;
};

// use leveing region data to get the height of a point
/** levelingOffsets:
 * A | B | C
 * D | E | F
 * G | H | I
 */
const getHeightOffsetFromLevelingRegion = (
  x: number,
  y: number,
  workarea: number[],
  levelingOffsets: { [key: string]: number }
) => {
  let xIndex = 0;
  if (x > workarea[0] * (2 / 3)) xIndex = 2;
  else if (x > workarea[0] * (1 / 3)) xIndex = 1;
  let yIndex = 0;
  if (y > workarea[1] * (2 / 3)) yIndex = 2;
  else if (y > workarea[1] * (1 / 3)) yIndex = 1;
  const key = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'][yIndex * 3 + xIndex];
  return levelingOffsets[key];
};

export const interpolatePointsFromHeight = (
  height: number,
  heights: number[],
  points: [number, number][][][],
  heightCompenstationDetail?: {
    chessboard: number[]; // dimension of chessboard, [x, y] in pixel
    workarea: number[];
    levelingOffsets: { [key: string]: number };
    center: number[]; // center in pixel
  }
): [number, number][][] => {
  if (points.length === 0) return [];
  if (points.length === 1) return points[0];

  const heightIndexDict: { [height: number]: number } = {};
  const result = JSON.parse(JSON.stringify(points[0])) as [number, number][][];
  let pointPositions: number[][][];
  if (heightCompenstationDetail) {
    const { chessboard, workarea, center } = heightCompenstationDetail;
    pointPositions = getRealPositionOfSplitIndices(
      [points[0].length - 1, points[0][0].length - 1],
      chessboard,
      workarea,
      center
    );
  }

  for (let i = 0; i < result.length; i += 1) {
    for (let j = 0; j < result[i].length; j += 1) {
      let h = height;
      if (heightCompenstationDetail) {
        const { workarea, levelingOffsets } = heightCompenstationDetail;
        h += getHeightOffsetFromLevelingRegion(
          pointPositions[i][j][0],
          pointPositions[i][j][1],
          workarea,
          levelingOffsets
        );
      }
      const floorH = Math.floor(h);
      if (heightIndexDict[floorH] === undefined)
        heightIndexDict[floorH] = binarySearchFindHeightIndex(heights, floorH);
      const index = heightIndexDict[floorH];
      result[i][j] = interpolateValue(
        heights[index],
        points[index][i][j] as number[],
        heights[index + 1],
        points[index + 1][i][j] as number[],
        h
      ) as [number, number];
    }
  }
  return result;
};

export const getPerspectivePointsZ3Regression = (
  height: number,
  regParam: number[][][][],
  heightCompenstationDetail?: {
    chessboard: number[]; // dimension of chessboard, [x, y] in pixel
    workarea: number[];
    levelingOffsets: { [key: string]: number };
    center: number[]; // center in pixel
  }
): [number, number][][] => {
  let pointPositions: number[][][];
  if (heightCompenstationDetail) {
    const { chessboard, workarea, center } = heightCompenstationDetail;
    pointPositions = getRealPositionOfSplitIndices(
      [regParam.length - 1, regParam[0].length - 1],
      chessboard,
      workarea,
      center
    );
  }
  const result: [number, number][][] = [];
  for (let i = 0; i < regParam.length; i += 1) {
    result.push([]);
    for (let j = 0; j < regParam[0].length; j += 1) {
      let h = height;
      if (heightCompenstationDetail) {
        const { workarea, levelingOffsets } = heightCompenstationDetail;
        h += getHeightOffsetFromLevelingRegion(
          pointPositions[i][j][0],
          pointPositions[i][j][1],
          workarea,
          levelingOffsets
        );
      }
      const x =
        regParam[i][j][0][0] * h ** 3 +
        regParam[i][j][0][1] * h ** 2 +
        regParam[i][j][0][2] * h +
        regParam[i][j][0][3];
      const y =
        regParam[i][j][1][0] * h ** 3 +
        regParam[i][j][1][1] * h ** 2 +
        regParam[i][j][1][2] * h +
        regParam[i][j][1][3];
      result[i].push([x, y]);
    }
  }
  return result;
};

export const calibrateChessboard = async (
  img: Blob | ArrayBuffer,
  height: number,
  chessboard = [48, 36]
): Promise<
  | {
      success: true;
      blob: Blob;
      data: {
        ret: number;
        k: number[][];
        d: number[][];
        rvec: number[];
        tvec: number[];
      };
    }
  | { success: false; data: { reason: string } }
> => {
  const resp = api.calibrateChessboard(img, height, chessboard);
  return resp;
};

export const findCorners = async (
  imgBlob: Blob,
  withPitch = false
): Promise<{
  success: boolean;
  blob: Blob;
  data?: {
    ret: number;
    k: number[][];
    d: number[][];
    rvec: number[];
    tvec: number[];
  };
}> => {
  const resp = await api.findCorners(imgBlob, withPitch);
  return resp;
};

export const solvePnPFindCorners = async (
  img: Blob | ArrayBuffer,
  dh: number,
  refPoints: [number, number][],
  interestArea?: { x: number; y: number; width: number; height: number }
): Promise<
  | {
      success: true;
      blob: Blob;
      data?: { points: [number, number][] };
    }
  | {
      success: false;
      blob: null;
      data: { status: string; info: string; reason: string };
    }
> => {
  const resp = await api.solvePnPFindCorners(img, dh, refPoints, interestArea);
  return resp;
};

export const solvePnPCalculate = async (
  dh: number,
  points: [number, number][],
  refPoints: [number, number][]
): Promise<{
  success: boolean;
  data?: { rvec: number[]; tvec: number[] };
}> => {
  const resp = await api.solvePnPCalculate(dh, points, refPoints);
  return resp;
};

export const updateData = async (data: FisheyeCaliParameters): Promise<boolean> => {
  const resp = await api.updateData(data);
  return resp;
};

export const extrinsicRegression = async (
  rvecs: number[][],
  tvecs: number[][],
  heights: number[]
): Promise<{
  success: boolean;
  data?: { rvec_polyfit: number[][]; tvec_polyfit: number[][] };
}> => {
  const resp = await api.extrinsicRegression(rvecs, tvecs, heights);
  return resp;
};
