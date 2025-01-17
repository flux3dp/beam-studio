import deviceMaster from 'helpers/device-master';
import progressCaller from 'app/actions/progress-caller';
import i18n from 'helpers/i18n';
import {
  FisheyeCameraParametersV1,
  FisheyePreviewManager,
  RotationParameters3DCalibration,
} from 'interfaces/FisheyePreview';
// TODO: move this 2 function to camera-preview-helpers
import {
  getPerspectivePointsZ3Regression,
  interpolatePointsFromHeight,
} from 'helpers/camera-calibration-helper';
import { getWorkarea, WorkAreaModel } from 'app/constants/workarea-constants';
import { IDeviceInfo } from 'interfaces/IDevice';

import FisheyePreviewManagerBase from './FisheyePreviewManagerBase';
import getAutoFocusPosition from './getAutoFocusPosition';
import getLevelingData from './getLevelingData';
import getHeight from './getHeight';
import loadCamera3dRotation from './loadCamera3dRotation';
import rawAndHome from './rawAndHome';

class FisheyePreviewManagerV1 extends FisheyePreviewManagerBase implements FisheyePreviewManager {
  declare params: FisheyeCameraParametersV1;

  rotationData: RotationParameters3DCalibration;

  version = 1;

  support3dRotation = true;

  constructor(device: IDeviceInfo, params: FisheyeCameraParametersV1) {
    super();
    this.device = device;
    this.params = params;
  }

  public async setupFisheyePreview(args: { progressId?: string } = {}): Promise<boolean> {
    const { device } = this;
    const { lang } = i18n;
    const { progressId } = args;
    if (!progressId) progressCaller.openNonstopProgress({ id: this.progressId });
    progressCaller.update(progressId || this.progressId, { message: 'Fetching leveling data...' });
    const levelingData = await getLevelingData('hexa_platform');
    const bottomCoverLevelingData = await getLevelingData('bottom_cover');
    this.levelingOffset = await getLevelingData('offset');
    const deviceRotationData = await loadCamera3dRotation();
    const rotationData = {
      ...deviceRotationData,
      tx: 0,
      ty: 0,
    } as RotationParameters3DCalibration;
    const keys = Object.keys(levelingData);
    keys.forEach((key) => {
      levelingData[key] -= bottomCoverLevelingData[key];
    });
    progressCaller.update(progressId || this.progressId, {
      message: lang.message.getProbePosition,
    });
    await rawAndHome(progressId || this.progressId);
    const height = await getHeight(device, progressId || this.progressId);
    if (typeof height !== 'number') {
      if (!progressId) progressCaller.popById(this.progressId);
      return false;
    }
    progressCaller.openNonstopProgress({
      id: progressId || this.progressId,
      message: lang.message.getProbePosition,
    });
    this.objectHeight = height;
    const autoFocusRefKey = await getAutoFocusPosition(device);
    const refHeight = levelingData[autoFocusRefKey];
    keys.forEach((key) => {
      levelingData[key] = Math.round((levelingData[key] - refHeight) * 1000) / 1000;
    });
    this.levelingData = levelingData;
    progressCaller.update(progressId || this.progressId, { message: lang.message.endingRawMode });
    await deviceMaster.endRawMode();
    if (deviceRotationData) await this.update3DRotation(rotationData);
    await this.onObjectHeightChanged();
    if (!progressId) progressCaller.popById(this.progressId);
    return true;
  }

  update3DRotation = async (newData: RotationParameters3DCalibration): Promise<void> => {
    const dhChanged = this.rotationData && this.rotationData.dh !== newData.dh;
    const { device, objectHeight } = this;
    console.log('Applying', newData);
    const { rx, ry, rz, sh, ch, tx = 0, ty = 0 } = newData;
    const workarea = getWorkarea(device.model as WorkAreaModel, 'ado1');
    const z = workarea.deep - objectHeight;
    const rotationZ = sh * (z + ch);
    this.rotationData = { ...newData };
    await deviceMaster.set3dRotation({ rx, ry, rz, h: rotationZ, tx, ty });
    if (dhChanged) await this.onObjectHeightChanged();
  };

  calculatePerspectivePoints = (): [number, number][][] => {
    const {
      device,
      params,
      levelingData: baseLevelingData,
      levelingOffset,
      rotationData,
      objectHeight,
    } = this;
    const { heights, center, points, z3regParam } = params;
    const workarea = getWorkarea(device.model as WorkAreaModel, 'ado1');
    let finalHeight = objectHeight;
    console.log('Use Height: ', objectHeight);
    if (rotationData?.dh) finalHeight += rotationData.dh;
    console.log('After applying 3d rotation dh: ', finalHeight);
    const levelingData = { ...baseLevelingData };
    const keys = Object.keys(levelingData);
    keys.forEach((key) => {
      levelingData[key] += levelingOffset[key] ?? 0;
    });
    let perspectivePoints: [number, number][][];
    if (points && heights) {
      [perspectivePoints] = points;
      perspectivePoints = interpolatePointsFromHeight(finalHeight ?? 0, heights, points, {
        chessboard: [48, 36],
        workarea: [workarea.width, workarea.height],
        center,
        levelingOffsets: levelingData,
      });
    } else if (z3regParam) {
      perspectivePoints = getPerspectivePointsZ3Regression(finalHeight ?? 0, z3regParam, {
        chessboard: [48, 36],
        workarea: [workarea.width, workarea.height],
        center,
        levelingOffsets: levelingData,
      });
    }
    return perspectivePoints;
  };

  onObjectHeightChanged = async (): Promise<void> => {
    const { params } = this;
    const perspectivePoints = this.calculatePerspectivePoints();
    const { k, d, center } = params;
    await deviceMaster.setFisheyeMatrix({ k, d, center, points: perspectivePoints }, true);
  };
}

export default FisheyePreviewManagerV1;
