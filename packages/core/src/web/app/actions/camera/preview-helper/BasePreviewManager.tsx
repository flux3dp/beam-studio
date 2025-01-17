/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import alertCaller from 'app/actions/alert-caller';
import alertConfig from 'helpers/api/alert-config';
import alertConstants from 'app/constants/alert-constants';
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import deviceMaster from 'helpers/device-master';
import i18n from 'helpers/i18n';
import { getSupportInfo } from 'app/constants/add-on';
import { getWorkarea, WorkArea, WorkAreaModel } from 'app/constants/workarea-constants';
import { IDeviceInfo } from 'interfaces/IDevice';
import { PreviewManager } from 'interfaces/PreviewManager';
import { PreviewSpeedLevel } from 'app/actions/beambox/constant';
import MessageCaller, { MessageLevel } from 'app/actions/message-caller';
import shortcuts from 'helpers/shortcuts';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import styles from './BasePreviewManager.module.scss';

class BasePreviewManager implements PreviewManager {
  public isFullScreen = false;
  protected device: IDeviceInfo;
  protected progressId: string;
  protected workarea: WorkAreaModel;
  protected workareaObj: WorkArea;
  protected ended = false;
  protected lastPosition: [number, number] = [0, 0];
  protected movementSpeed: number; // mm/min
  protected maxMovementSpeed: [number, number] = [18000, 6000]; // mm/min, speed cap of machine

  constructor(device: IDeviceInfo) {
    this.device = device;
    // or use device.model?
    this.workarea = beamboxPreference.read('workarea');
    this.workareaObj = getWorkarea(this.workarea);
  }

  public setup = async (): Promise<boolean> => {
    throw new Error('Method not implemented.');
  };

  public end = async (): Promise<void> => {
    this.ended = true;
    try {
      const res = await deviceMaster.select(this.device);
      deviceMaster.disconnectCamera();
      if (res.success) deviceMaster.kick();
    } catch (error) {
      console.error('Failed to end PreviewManager', error);
    }
  };

  public preview = async (
    x: number,
    y: number,
    opts?: { overlapRatio?: number; overlapFlag?: number }
  ): Promise<boolean> => {
    throw new Error('Method not implemented.');
  };

  public previewRegion = async (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Promise<boolean> => {
    throw new Error('Method not implemented.');
  };

  // for Beam Series, BB2
  previewRegionFromPoints = async (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    {
      getPoints = () => [],
      overlapRatio = 0.05,
    }: {
      getPoints?: () => Array<{ point: [number, number]; overlapFlag: number }>;
      overlapRatio?: number;
    } = {}
  ): Promise<boolean> => {
    const points = getPoints();

    let isStopped = false;
    const triggerPause = () => {
      isStopped = true;
    };
    const unregisterPauseShortcut = shortcuts.on(['Escape'], triggerPause, { isBlocking: true });

    try {
      for (let i = 0; i < points.length; i += 1) {
        if (this.ended) return false;

        MessageCaller.openMessage({
          key: 'camera-preview',
          // add margin to prevent message display at the draggable area
          className: styles['mt-24'],
          content: (
            <>
              {`${i18n.lang.topbar.preview} ${i}/${points.length} `}
              <Tooltip title={i18n.lang.topbar.preview_press_esc_to_stop}>
                <QuestionCircleOutlined />
              </Tooltip>
            </>
          ),
          level: MessageLevel.LOADING,
          duration: 20,
        });

        const { point, overlapFlag } = points[i];
        // eslint-disable-next-line no-await-in-loop
        const result = await this.preview(point[0], point[1], { overlapRatio, overlapFlag });

        if (!result) return false;
        if (isStopped) break;
      }

      if (isStopped) {
        MessageCaller.closeMessage('camera-preview');
      } else {
        MessageCaller.openMessage({
          key: 'camera-preview',
          className: styles['mt-24'],
          level: MessageLevel.SUCCESS,
          content: i18n.lang.device.completed,
          duration: 3,
        });
      }

      return true;
    } catch (error) {
      MessageCaller.closeMessage('camera-preview');

      throw error;
    } finally {
      unregisterPauseShortcut();
    }
  };

  protected getMovementSpeed = (): number => {
    // fixed to 3600 for diode laser
    if (beamboxPreference.read('enable-diode') && getSupportInfo(this.workarea).hybridLaser)
      return 3600;
    const previewMovementSpeedLevel = beamboxPreference.read('preview_movement_speed_level');
    if (previewMovementSpeedLevel === PreviewSpeedLevel.FAST) return 18000;
    if (previewMovementSpeedLevel === PreviewSpeedLevel.MEDIUM) return 14400;
    return 10800;
  };

  /**
   * constrain the preview area
   * @param x x in px
   * @param y y in px
   */
  constrainPreviewXY = (x: number, y: number): { x: number; y: number } => {
    const { pxWidth: width, pxHeight, pxDisplayHeight } = this.workareaObj;
    const height = pxDisplayHeight ?? pxHeight;
    return {
      x: Math.min(Math.max(x, 0), width),
      y: Math.min(Math.max(y, 0), height),
    };
  };

  /**
   * getPhotoAfterMoveTo
   * @param movementX x in mm
   * @param movementY y in mm
   * @returns image blob url of the photo taken
   */
  async getPhotoAfterMoveTo(movementX: number, movementY: number): Promise<string> {
    const moveRes = await this.moveTo(movementX, movementY);
    if (!moveRes) return null;

    return this.getPhotoFromMachine();
  }

  /**
   * Use raw command to move the camera to the target position
   * and wait an estimated time for the camera to take a stable picture
   * @param movementX x in mm
   * @param movementY y in mm
   */
  async moveTo(movementX: number, movementY: number): Promise<boolean> {
    const selectRes = await deviceMaster.select(this.device);
    if (!selectRes.success) return false;
    const control = await deviceMaster.getControl();
    if (control.getMode() !== 'raw') await deviceMaster.enterRawMode();
    if (!this.movementSpeed) this.movementSpeed = this.getMovementSpeed();
    const movement = { f: this.movementSpeed, x: movementX, y: movementY };
    await deviceMaster.rawMove(movement);
    const [lastX, lastY] = this.lastPosition;
    const [distX, distY] = [Math.abs(movementX - lastX), Math.abs(movementY - lastY)];
    const totalDist = Math.hypot(distX, distY);
    // the actual speed is limited by maxSpeedX and maxSpeedY
    const [maxSpeedX, maxSpeedY] = this.maxMovementSpeed;
    let timeToWait =
      Math.max(distX / maxSpeedX, distY / maxSpeedY, totalDist / this.movementSpeed) * 60000; // min => ms
    // wait for moving camera to take a stable picture, this value need to be optimized
    timeToWait *= 1.2;
    timeToWait += 100;
    this.lastPosition = [movementX, movementY];
    await new Promise<void>((r) => setTimeout(r, timeToWait));
    return true;
  }

  async getPhotoFromMachine(): Promise<string> {
    const { lang } = i18n;
    const { imgBlob, needCameraCableAlert } = (await deviceMaster.takeOnePicture()) ?? {};
    if (!imgBlob) {
      throw new Error(lang.message.camera.ws_closed_unexpectly);
    } else if (needCameraCableAlert && !alertConfig.read('skip_camera_cable_alert')) {
      const shouldContinue = await new Promise<boolean>((resolve) => {
        alertCaller.popUp({
          id: 'camera_cable_alert',
          message: lang.message.camera.camera_cable_unstable,
          type: alertConstants.SHOW_POPUP_WARNING,
          checkbox: {
            text: lang.beambox.popup.dont_show_again,
            callbacks: () => alertConfig.write('skip_camera_cable_alert', true),
          },
          buttonLabels: [lang.message.camera.abort_preview, lang.message.camera.continue_preview],
          callbacks: [() => resolve(false), () => resolve(true)],
          primaryButtonIndex: 1,
        });
      });
      if (!shouldContinue) {
        this.end();
        return null;
      }
    }

    return URL.createObjectURL(imgBlob);
  }
}

export default BasePreviewManager;
