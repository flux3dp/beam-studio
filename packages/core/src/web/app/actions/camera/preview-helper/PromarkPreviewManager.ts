import alertCaller from 'app/actions/alert-caller';
import CameraTransformAPI from 'helpers/api/camera-transform';
import i18n from 'helpers/i18n';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import PreviewModeBackgroundDrawer from 'app/actions/beambox/preview-mode-background-drawer';
import progressCaller from 'app/actions/progress-caller';
import promarkDataStore from 'helpers/device/promark/promark-data-store';
import webcamHelper, { WebCamConnection } from 'helpers/webcam-helper';
import workareaManager from 'app/svgedit/workarea';
import { FisheyeCameraParameters } from 'interfaces/FisheyePreview';
import { getWorkarea } from 'app/constants/workarea-constants';
import { IDeviceInfo } from 'interfaces/IDevice';
import { PreviewManager } from 'interfaces/PreviewManager';

import BasePreviewManager from './BasePreviewManager';

// TODO: Add tests
class PromarkPreviewManager extends BasePreviewManager implements PreviewManager {
  public isFullScreen = true;
  private fisheyeParams: FisheyeCameraParameters;
  private cameraTransformAPI: CameraTransformAPI;
  private webCamConnection: WebCamConnection;

  constructor(device: IDeviceInfo) {
    super(device);
    this.progressId = 'promark-preview-manager';
  }

  public setup = async (args?: { progressId?: string }): Promise<boolean> => {
    const { lang } = i18n;
    const { progressId } = args || {};
    if (progressId) this.progressId = progressId;
    try {
      progressCaller.openNonstopProgress({
        id: this.progressId,
        message: lang.message.connectingCamera,
      });
      this.fisheyeParams = promarkDataStore.get(this.device.serial, 'cameraParameters');
      if (!this.fisheyeParams) {
        throw new Error(
          'Unable to get fisheye parameters, please make sure you have calibrated the camera'
        );
      }
      await this.setupAPI();
      this.webCamConnection = await webcamHelper.connectWebcam();
      return !!this.webCamConnection;
    } catch (error) {
      console.error(error);
      if (error.message && error.message.startsWith('Camera WS')) {
        alertCaller.popUpError({
          message: `${lang.topbar.alerts.fail_to_connect_with_camera}<br/>${error.message || ''}`,
        });
      } else {
        alertCaller.popUpError({
          message: `${lang.topbar.alerts.fail_to_start_preview}<br/>${error.message || ''}`,
        });
      }
      return false;
    } finally {
      progressCaller.popById(this.progressId);
    }
  };

  private setupAPI = async (): Promise<void> => {
    this.cameraTransformAPI = new CameraTransformAPI();
    let res = await this.cameraTransformAPI.setFisheyeParam(this.fisheyeParams);
    if (!res) {
      throw new Error('Failed to set fisheye parameters');
    }
    const workarea = getWorkarea(workareaManager.model);
    const { width, height } = workarea;
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
        key: 'full-area-preview',
        content: i18n.lang.topbar.preview,
        level: MessageLevel.LOADING,
        duration: 20,
      });
      let imgBlob = await this.webCamConnection.getPicture();
      imgBlob = await this.cameraTransformAPI.transformImage(imgBlob);
      const imgUrl = URL.createObjectURL(imgBlob);
      await new Promise<void>((resolve) => {
        PreviewModeBackgroundDrawer.drawFullWorkarea(imgUrl, resolve);
      });
      URL.revokeObjectURL(imgUrl);
      MessageCaller.openMessage({
        key: 'full-area-preview',
        level: MessageLevel.SUCCESS,
        content: 'Successfully previewed',
        duration: 3,
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
