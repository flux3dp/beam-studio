import progressCaller from '@core/app/actions/progress-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { getPerspectivePointsZ3Regression, interpolatePointsFromHeight } from '@core/helpers/camera-calibration-helper';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import type {
  FisheyeCameraParametersV1,
  FisheyePreviewManager,
  RotationParameters3DCalibration,
} from '@core/interfaces/FisheyePreview';
// TODO: move this 2 function to camera-preview-helpers
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import FisheyePreviewManagerBase from './FisheyePreviewManagerBase';
import getAutoFocusPosition from './getAutoFocusPosition';
import getHeight from './getHeight';
import getLevelingData from './getLevelingData';
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

  public async setupFisheyePreview(
    args: {
      closeMessage?: () => void;
      updateMessage?: (message: string) => void;
    } = {},
  ): Promise<boolean> {
    const { device } = this;
    const { lang } = i18n;
    const showMessage = args.updateMessage ? null : () => progressCaller.openNonstopProgress({ id: this.progressId });
    const updateMessage =
      args.updateMessage || ((message: string) => progressCaller.update(this.progressId, { message }));
    const closeMessage = args.closeMessage || (() => progressCaller.popById(this.progressId));

    showMessage?.();
    updateMessage('Fetching leveling data...');

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
    updateMessage(lang.message.getProbePosition);
    await rawAndHome(updateMessage);

    const height = await getHeight(device, { closeMessage, updateMessage });

    if (typeof height !== 'number') {
      return false;
    }

    showMessage?.();
    updateMessage(lang.message.getProbePosition);
    this.objectHeight = height;

    const autoFocusRefKey = await getAutoFocusPosition(device);
    const refHeight = levelingData[autoFocusRefKey];

    keys.forEach((key) => {
      levelingData[key] = Math.round((levelingData[key] - refHeight) * 1000) / 1000;
    });
    this.levelingData = levelingData;
    updateMessage(lang.message.endingRawMode);
    await deviceMaster.endSubTask();

    if (deviceRotationData) {
      await this.update3DRotation(rotationData);
    }

    await this.onObjectHeightChanged();

    closeMessage?.();

    return true;
  }

  update3DRotation = async (newData: RotationParameters3DCalibration): Promise<void> => {
    const dhChanged = this.rotationData && this.rotationData.dh !== newData.dh;
    const { device, objectHeight } = this;

    console.log('Applying', newData);

    const { ch, rx, ry, rz, sh, tx = 0, ty = 0 } = newData;
    const workarea = getWorkarea(device.model as WorkAreaModel, 'ado1');
    const z = workarea.deep - objectHeight;
    const rotationZ = sh * (z + ch);

    this.rotationData = { ...newData };
    await deviceMaster.set3dRotation({ h: rotationZ, rx, ry, rz, tx, ty });

    if (dhChanged) {
      await this.onObjectHeightChanged();
    }
  };

  calculatePerspectivePoints = (): Array<Array<[number, number]>> => {
    const { device, levelingData: baseLevelingData, levelingOffset, objectHeight, params, rotationData } = this;
    const { center, heights, points, z3regParam } = params;
    const workarea = getWorkarea(device.model as WorkAreaModel, 'ado1');
    let finalHeight = objectHeight;

    console.log('Use Height: ', objectHeight);

    if (rotationData?.dh) {
      finalHeight += rotationData.dh;
    }

    console.log('After applying 3d rotation dh: ', finalHeight);

    const levelingData = { ...baseLevelingData };
    const keys = Object.keys(levelingData);

    keys.forEach((key) => {
      levelingData[key] += levelingOffset[key] ?? 0;
    });

    let perspectivePoints: Array<Array<[number, number]>>;

    if (points && heights) {
      [perspectivePoints] = points;
      perspectivePoints = interpolatePointsFromHeight(finalHeight ?? 0, heights, points, {
        center,
        chessboard: [48, 36],
        levelingOffsets: levelingData,
        workarea: [workarea.width, workarea.height],
      });
    } else if (z3regParam) {
      perspectivePoints = getPerspectivePointsZ3Regression(finalHeight ?? 0, z3regParam, {
        center,
        chessboard: [48, 36],
        levelingOffsets: levelingData,
        workarea: [workarea.width, workarea.height],
      });
    }

    return perspectivePoints;
  };

  onObjectHeightChanged = async (): Promise<void> => {
    const { params } = this;
    const perspectivePoints = this.calculatePerspectivePoints();
    const { center, d, k } = params;

    await deviceMaster.setFisheyeMatrix({ center, d, k, points: perspectivePoints }, true);
  };
}

export default FisheyePreviewManagerV1;
