import alertCaller from '@core/app/actions/alert-caller';
import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import progressCaller from '@core/app/actions/progress-caller';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import workareaManager from '@core/app/svgedit/workarea';
import CameraTransformAPI from '@core/helpers/api/camera-transform';
import promarkDataStore from '@core/helpers/device/promark/promark-data-store';
import i18n from '@core/helpers/i18n';
import type { WebCamConnection } from '@core/helpers/webcam-helper';
import webcamHelper from '@core/helpers/webcam-helper';
import type { FisheyeCameraParameters } from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { PreviewManager, PreviewManagerArguments } from '@core/interfaces/PreviewManager';

import BasePreviewManager from './BasePreviewManager';

// TODO: Add tests
class PromarkPreviewManager extends BasePreviewManager implements PreviewManager {
  protected _isFullScreen = true;
  private fisheyeParams?: FisheyeCameraParameters;
  private cameraTransformAPI?: CameraTransformAPI;
  private webCamConnection: null | WebCamConnection = null;

  constructor(device: IDeviceInfo, args?: PreviewManagerArguments) {
    super(device, args);
    this.progressId = 'promark-preview-manager';
  }

  public setup = async (args?: { progressId?: string }): Promise<boolean> => {
    const { lang } = i18n;
    const { progressId } = args || {};

    if (progressId) {
      this.progressId = progressId;
    }

    try {
      progressCaller.openNonstopProgress({
        id: this.progressId,
        message: lang.message.connectingCamera,
      });
      this.fisheyeParams = promarkDataStore.get(this.device.serial, 'cameraParameters');

      if (!this.fisheyeParams) {
        throw new Error('Unable to get fisheye parameters, please make sure you have calibrated the camera');
      }

      await this.setupAPI();
      this.webCamConnection = await webcamHelper.connectWebcam();

      return !!this.webCamConnection;
    } catch (error) {
      console.error(error);

      if ('message' in (error as Error) && (error as Error).message.startsWith('Camera WS')) {
        alertCaller.popUpError({
          message: `${lang.topbar.alerts.fail_to_connect_with_camera}<br/>${(error as Error).message || ''}`,
        });
      } else {
        alertCaller.popUpError({
          message: `${lang.topbar.alerts.fail_to_start_preview}<br/>${(error as Error).message || ''}`,
        });
      }

      return false;
    } finally {
      progressCaller.popById(this.progressId);
    }
  };

  private setupAPI = async (): Promise<void> => {
    this.cameraTransformAPI = new CameraTransformAPI();

    let res = await this.cameraTransformAPI.setFisheyeParam(this.fisheyeParams!);

    if (!res) {
      throw new Error('Failed to set fisheye parameters');
    }

    const workarea = getWorkarea(workareaManager.model);
    const { height, width } = workarea;

    res = await this.cameraTransformAPI.setFisheyeGrid({ x: [0, width, 10], y: [0, height, 10] });

    if (!res) {
      throw new Error('Failed to set fisheye grid');
    }
  };

  public end = async (): Promise<void> => {
    this.webCamConnection?.end();
    this.cameraTransformAPI?.close();
  };

  public preview = async (): Promise<boolean> => {
    try {
      MessageCaller.openMessage({
        content: i18n.lang.topbar.preview,
        duration: 20,
        key: 'full-area-preview',
        level: MessageLevel.LOADING,
      });

      let imgBlob = await this.webCamConnection!.getPicture();

      imgBlob = await this.cameraTransformAPI!.transformImage(imgBlob);

      const imgUrl = URL.createObjectURL(imgBlob);

      await new Promise<void>((resolve) => {
        PreviewModeBackgroundDrawer.drawFullWorkarea(imgUrl, resolve);
      });
      URL.revokeObjectURL(imgUrl);
      MessageCaller.openMessage({
        content: i18n.lang.message.preview.succeeded,
        duration: 3,
        key: 'full-area-preview',
        level: MessageLevel.SUCCESS,
      });

      return true;
    } catch (error) {
      MessageCaller.closeMessage('full-area-preview');
      throw error;
    }
  };

  public previewRegion = async (): Promise<boolean> => {
    const res = await this.preview();

    return res;
  };

  public previewFullWorkarea? = async (): Promise<boolean> => {
    const res = await this.preview();

    return res;
  };
}

export default PromarkPreviewManager;
