import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { getPerspectivePointsZ3Regression, interpolatePointsFromHeight } from '@core/helpers/camera-calibration-helper';
import deviceMaster from '@core/helpers/device-master';
import type { FisheyeCameraParametersV1, RotationParameters3D } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

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

const loadCamera3dRotation = async (): Promise<null | RotationParameters3D> => {
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
    const { didAf, z } = res;

    if (didAf) {
      return getWorkarea(device.model as WorkAreaModel, 'ado1').deep - z;
    }
  } catch (e) {
    console.log('Fail to get probe position, using custom height', e);

    // do nothing
    return 0;
  } finally {
    if (enteredRawMode) {
      await deviceMaster.endSubTask();
    }
  }

  return 0;
};

const getPerspectiveForAlign = async (
  device: IDeviceInfo,
  param: FisheyeCameraParametersV1,
  center: number[],
): Promise<Array<Array<[number, number]>>> => {
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
    const { ch, rx, ry, rz, sh } = rotationParam;
    const z = workarea.deep - height;
    const rotationZ = sh * (z + ch);

    await deviceMaster.set3dRotation({ h: rotationZ, rx, ry, rz, tx: 0, ty: 0 });
  }

  console.log('Use Height: ', height);

  if (rotationParam?.dh) {
    height += rotationParam.dh;
  }

  console.log('After applying rotation 3d dh: ', height);

  const { heights, points, z3regParam } = param;
  let perspectivePoints: Array<Array<[number, number]>>;

  if (points && heights) {
    [perspectivePoints] = points;
    perspectivePoints = interpolatePointsFromHeight(height ?? 0, heights, points, {
      center,
      chessboard: [48, 36],
      levelingOffsets: autoLevelingData,
      workarea: [workarea.width, workarea.height],
    });
  } else if (z3regParam) {
    perspectivePoints = getPerspectivePointsZ3Regression(height ?? 0, z3regParam, {
      center,
      chessboard: [48, 36],
      levelingOffsets: autoLevelingData,
      workarea: [workarea.width, workarea.height],
    });
  }

  return perspectivePoints;
};

export default getPerspectiveForAlign;
