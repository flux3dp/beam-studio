import deviceMaster from 'helpers/device-master';
import { FisheyeCameraParametersV1, RotationParameters3D } from 'interfaces/FisheyePreview';
import {
  getPerspectivePointsZ3Regression,
  interpolatePointsFromHeight,
} from 'helpers/camera-calibration-helper';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { IDeviceInfo } from 'interfaces/IDevice';

const getHeightOffsets = async () => {
  let autoLevelingData: { [key: string]: number } = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
    G: 0,
    H: 0,
    I: 0,
  };
  let heightOffset = { ...autoLevelingData };
  try {
    autoLevelingData = await deviceMaster.fetchAutoLevelingData('hexa_platform');
    console.log('hexa_platform leveling data', { ...autoLevelingData });
  } catch (e) {
    console.error('Unable to get hexa_platform leveling data', e);
  }
  try {
    const data = await deviceMaster.fetchAutoLevelingData('bottom_cover');
    const keys = Object.keys(data);
    console.log('bottom_cover leveling data', data);
    keys.forEach((key) => {
      autoLevelingData[key] -= data[key];
    });
  } catch (e) {
    console.error('Unable to get bottom_cover leveling data', e);
  }
  try {
    heightOffset = await deviceMaster.fetchAutoLevelingData('offset');
  } catch (e) {
    console.error('Unable to get height offset data', e);
  }

  return { autoLevelingData, heightOffset };
};

const loadCamera3dRotation = async (): Promise<RotationParameters3D | null> => {
  try {
    const data = await deviceMaster.fetchFisheye3DRotation();
    console.log('fetchFisheye3DRotation', data);
    return data;
  } catch (e) {
    console.error('Unable to get fisheye 3d rotation', e);
  }
  return null;
};

const getHeight = async (device: IDeviceInfo) => {
  let enteredRawMode = false;
  try {
    await deviceMaster.enterRawMode();
    enteredRawMode = true;
    const res = await deviceMaster.rawGetProbePos();
    const { z, didAf } = res;
    if (didAf) {
      return getWorkarea(device.model as WorkAreaModel, 'ado1').deep - z;
    }
  } catch (e) {
    console.log('Fail to get probe position, using custom height', e);
    // do nothing
    return 0;
  } finally {
    if (enteredRawMode) await deviceMaster.endRawMode();
  }
  return 0;
};

const getPerspectiveForAlign = async (
  device: IDeviceInfo,
  param: FisheyeCameraParametersV1,
  center: number[]
): Promise<[number, number][][]> => {
  const { autoLevelingData, heightOffset } = await getHeightOffsets();
  const rotationParam = await loadCamera3dRotation();
  const refKey = 'E';
  const refHeight = autoLevelingData[refKey];
  const keys = Object.keys(autoLevelingData);
  keys.forEach((key) => {
    autoLevelingData[key] = Math.round((autoLevelingData[key] - refHeight) * 1000) / 1000;
    autoLevelingData[key] += heightOffset[key] ?? 0;
  });
  const workarea = getWorkarea(device.model as WorkAreaModel, 'ado1');
  let height = await getHeight(device);
  if (rotationParam) {
    const { rx, ry, rz, sh, ch } = rotationParam;
    const z = workarea.deep - height;
    const rotationZ = sh * (z + ch);
    await deviceMaster.set3dRotation({ rx, ry, rz, h: rotationZ, tx: 0, ty: 0 });
  }
  console.log('Use Height: ', height);
  if (rotationParam?.dh) height += rotationParam.dh;
  console.log('After applying rotation 3d dh: ', height);
  const { heights, points, z3regParam } = param;
  let perspectivePoints: [number, number][][];

  if (points && heights) {
    [perspectivePoints] = points;
    perspectivePoints = interpolatePointsFromHeight(height ?? 0, heights, points, {
      chessboard: [48, 36],
      workarea: [workarea.width, workarea.height],
      center,
      levelingOffsets: autoLevelingData,
    });
  } else if (z3regParam) {
    perspectivePoints = getPerspectivePointsZ3Regression(height ?? 0, z3regParam, {
      chessboard: [48, 36],
      workarea: [workarea.width, workarea.height],
      center,
      levelingOffsets: autoLevelingData,
    });
  }
  return perspectivePoints;
};

export default getPerspectiveForAlign;
