/* eslint-disable ts/no-unused-vars */
import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import { PreviewSpeedLevel } from '@core/app/actions/beambox/constant';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import alertConstants from '@core/app/constants/alert-constants';
import type { WorkArea, WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import workareaManager from '@core/app/svgedit/workarea';
import alertConfig from '@core/helpers/api/alert-config';
import type { TakePictureOptions } from '@core/helpers/device-master';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import shortcuts from '@core/helpers/shortcuts';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { IMessage } from '@core/interfaces/IMessage';
import type { PreviewManager } from '@core/interfaces/PreviewManager';

import styles from './BasePreviewManager.module.scss';

interface Message extends Omit<IMessage, 'level'> {
  level?: MessageLevel;
}

class BasePreviewManager implements PreviewManager {
  protected device: IDeviceInfo;
  protected progressId: string = 'base-preview-manager';
  protected workarea: WorkAreaModel;
  protected workareaObj: WorkArea;
  protected ended = false;
  protected lastPosition: [number, number] = [0, 0];
  protected movementSpeed: null | number = null; // mm/min
  protected maxMovementSpeed: [number, number] = [18000, 6000]; // mm/min, speed cap of machine
  protected _isFullScreen = false;

  public get isFullScreen() {
    return this._isFullScreen;
  }

  constructor(device: IDeviceInfo) {
    this.device = device;
    this.workarea = workareaManager.model;
    this.workareaObj = getWorkarea(this.workarea);
  }

  protected showMessage = (data: Message): void => {
    // add margin to prevent message display at the draggable area
    const defaultData = { className: styles['mt-24'], duration: 20, key: this.progressId, level: MessageLevel.LOADING };

    MessageCaller.openMessage({
      ...defaultData,
      ...data,
    });
  };

  protected closeMessage = (): void => {
    MessageCaller.closeMessage(this.progressId);
  };

  public setup = async (): Promise<boolean> => {
    throw new Error('Method not implemented.');
  };

  public end = async (): Promise<void> => {
    this.ended = true;
    try {
      const res = await deviceMaster.select(this.device);

      deviceMaster.disconnectCamera();

      if (res.success) {
        deviceMaster.kick();
      }
    } catch (error) {
      console.error('Failed to end PreviewManager', error);
    }
  };

  public preview = async (
    x: number,
    y: number,
    opts?: { overlapFlag?: number; overlapRatio?: number },
  ): Promise<boolean> => {
    throw new Error('Method not implemented.');
  };

  public previewRegion = async (x1: number, y1: number, x2: number, y2: number): Promise<boolean> => {
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
      getPoints?: () => Array<{ overlapFlag: number; point: [number, number] }>;
      overlapRatio?: number;
    } = {},
  ): Promise<boolean> => {
    const points = getPoints();

    let isStopped = false;
    const triggerPause = () => {
      isStopped = true;
    };
    const unregisterPauseShortcut = shortcuts.on(['Escape'], triggerPause, { isBlocking: true });

    try {
      for (let i = 0; i < points.length; i += 1) {
        if (this.ended) {
          return false;
        }

        this.showMessage({
          content: (
            <>
              {`${i18n.lang.message.preview.capturing_image} ${i}/${points.length} `}
              <Tooltip title={i18n.lang.message.preview.press_esc_to_stop}>
                <QuestionCircleOutlined />
              </Tooltip>
            </>
          ),
        });

        const { overlapFlag, point } = points[i];

        const result = await this.preview(point[0], point[1], { overlapFlag, overlapRatio });

        if (!result) {
          return false;
        }

        if (isStopped) {
          break;
        }
      }

      if (isStopped) {
        this.closeMessage();
      } else {
        this.showMessage({ content: i18n.lang.device.completed, duration: 3, level: MessageLevel.SUCCESS });
      }

      return true;
    } catch (error) {
      this.closeMessage();

      throw error;
    } finally {
      unregisterPauseShortcut();
    }
  };

  protected getMovementSpeed = (): number => {
    const { 'enable-diode': enableDiode } = useDocumentStore.getState();

    // fixed to 3600 for diode laser
    if (enableDiode && getAddOnInfo(this.workarea).hybridLaser) {
      return 3600;
    }

    // TODO: subscribe to change preview speed on change
    const previewMovementSpeedLevel = useGlobalPreferenceStore.getState()['preview_movement_speed_level'];

    if (previewMovementSpeedLevel === PreviewSpeedLevel.FAST) {
      return 18000;
    }

    if (previewMovementSpeedLevel === PreviewSpeedLevel.MEDIUM) {
      return 14400;
    }

    return 10800;
  };

  /**
   * constrain the preview area
   * @param x x in px
   * @param y y in px
   */
  constrainPreviewXY = (x: number, y: number): { x: number; y: number } => {
    const { pxDisplayHeight, pxHeight, pxWidth: width } = this.workareaObj;
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

    if (!moveRes) {
      return null;
    }

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

    if (!selectRes.success) {
      return false;
    }

    const control = await deviceMaster.getControl();

    if (control.getMode() !== 'raw') {
      await deviceMaster.enterRawMode();
    }

    if (!this.movementSpeed) {
      this.movementSpeed = this.getMovementSpeed();
    }

    const movement = { f: this.movementSpeed, x: movementX, y: movementY };

    await deviceMaster.rawMove(movement);

    const [lastX, lastY] = this.lastPosition;
    const [distX, distY] = [Math.abs(movementX - lastX), Math.abs(movementY - lastY)];
    const totalDist = Math.hypot(distX, distY);
    // the actual speed is limited by maxSpeedX and maxSpeedY
    const [maxSpeedX, maxSpeedY] = this.maxMovementSpeed;
    let timeToWait = Math.max(distX / maxSpeedX, distY / maxSpeedY, totalDist / this.movementSpeed) * 60000; // min => ms

    // wait for moving camera to take a stable picture, this value need to be optimized
    timeToWait *= 1.2;
    timeToWait += 100;
    this.lastPosition = [movementX, movementY];
    await new Promise<void>((r) => setTimeout(r, timeToWait));

    return true;
  }

  async getPhotoFromMachine(opts: TakePictureOptions = {}): Promise<string> {
    const { lang } = i18n;
    const { imgBlob, needCameraCableAlert } = (await deviceMaster.takeOnePicture(opts)) ?? {};

    if (!imgBlob) {
      throw new Error(lang.message.camera.ws_closed_unexpectedly);
    } else if (needCameraCableAlert && !alertConfig.read('skip_camera_cable_alert')) {
      const shouldContinue = await new Promise<boolean>((resolve) => {
        alertCaller.popUp({
          buttonLabels: [lang.message.camera.abort_preview, lang.message.camera.continue_preview],
          callbacks: [() => resolve(false), () => resolve(true)],
          checkbox: {
            callbacks: () => alertConfig.write('skip_camera_cable_alert', true),
            text: lang.alert.dont_show_again,
          },
          id: 'camera_cable_alert',
          message: lang.message.camera.camera_cable_unstable,
          primaryButtonIndex: 1,
          type: alertConstants.SHOW_POPUP_WARNING,
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
