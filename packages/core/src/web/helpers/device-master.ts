import { sprintf } from 'sprintf-js';
import { match } from 'ts-pattern';

import Alert from '@core/app/actions/alert-caller';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import Dialog from '@core/app/actions/dialog-caller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import type { SelectionResult } from '@core/app/constants/connection-constants';
import { ConnectionError } from '@core/app/constants/connection-constants';
import DeviceConstants from '@core/app/constants/device-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import checkSoftwareForAdor from '@core/helpers/check-software';
import storage from '@core/implementations/storage';
import type {
  FisheyeCameraParameters,
  FisheyeMatrix,
  PerspectiveGrid,
  RotationParameters3D,
  RotationParameters3DGhostApi,
} from '@core/interfaces/FisheyePreview';
import type { TPromarkFramingOpt } from '@core/interfaces/IControlSocket';
import type IControlSocket from '@core/interfaces/IControlSocket';
import type { FirmwareType, IDeviceConnection, IDeviceDetailInfo, IDeviceInfo } from '@core/interfaces/IDevice';
import type { Field, GalvoParameters } from '@core/interfaces/Promark';

import Camera from './api/camera';
import Control from './api/control';
import { discoverManager } from './api/discover';
import { swiftrayClient } from './api/swiftray-client';
import SwiftrayControl from './api/swiftray-control';
import Touch from './api/touch';
import promarkDataStore from './device/promark/promark-data-store';
import i18n from './i18n';
import VersionChecker from './version-checker';

export type TakePictureOptions = { timeout?: number; useLowResolution?: boolean };

class DeviceMaster {
  private deviceConnections: Map<string, IDeviceConnection>;

  private discoveredDevices: IDeviceInfo[];

  private unnotifiedDeviceUUIDs: string[] = [];

  public currentDevice?: IDeviceConnection;

  constructor() {
    this.deviceConnections = new Map<string, IDeviceConnection>();
    this.discoveredDevices = [];
    discoverManager.register('device-master', (devices) => {
      this.discoveredDevices = devices;
      this.scanDeviceError(devices);
    });
  }

  scanDeviceError = (devices: IDeviceInfo[]) => {
    devices.forEach((info) => {
      const deviceConn = this.getDeviceByUUID(info.uuid);

      if (typeof deviceConn.errors === 'string') {
        if (deviceConn.errors !== info.error_label && info.error_label) {
          Alert.popUp({
            message: `${info.name}: ${info.error_label}`,
            type: AlertConstants.SHOW_POPUP_ERROR,
          });
          deviceConn.errors = info.error_label;
        } else if (!info.error_label) {
          deviceConn.errors = [];
        }
      } else {
        deviceConn.errors = [];
      }

      const { ABORTED, COMPLETED, PAUSED_FROM_RUNNING } = DeviceConstants.status;

      if ([ABORTED, COMPLETED, PAUSED_FROM_RUNNING].includes(info.st_id)) {
        if (this.unnotifiedDeviceUUIDs.find((uuid) => uuid === info.uuid)) {
          let message = '';
          const { lang } = i18n;

          if (deviceConn.info.st_id === DeviceConstants.status.COMPLETED) {
            message = `${lang.device.completed}`;
          } else if (deviceConn.info.st_id === DeviceConstants.status.ABORTED) {
            message = `${lang.device.aborted}`;
          } else {
            if (!info.error_label) {
              return;
            }

            message = `${lang.device.pausedFromError}`;
            message = deviceConn.info.error_label === '' ? '' : message;
          }

          const index = this.unnotifiedDeviceUUIDs.findIndex((uuid) => uuid === info.uuid);

          this.unnotifiedDeviceUUIDs.splice(index, 1);

          if (storage.get('notification')) {
            Notification.requestPermission((permission) => {
              if (permission === 'granted') {
                const notification = new Notification(deviceConn.info.name, {
                  body: message,
                  icon: 'img/icon-home-s.png',
                });

                console.log(notification);
              }
            });
          }
        }
      } else if ([DeviceConstants.status.RUNNING].includes(info.st_id)) {
        if (!this.unnotifiedDeviceUUIDs.find((uuid) => uuid === info.uuid)) {
          this.unnotifiedDeviceUUIDs.push(info.uuid);
        }
      }
    });
  };

  // device are stored in array _devices
  getAvailableDevices() {
    return this.discoveredDevices;
  }

  get currentControlMode() {
    if (this.currentDevice?.control) {
      return this.currentDevice.control.getMode();
    }

    return null;
  }

  private getDeviceByUUID(uuid: string): IDeviceConnection {
    if (!this.deviceConnections.get(uuid)) {
      this.deviceConnections.set(uuid, {
        camera: null,
        cameraNeedsFlip: null,
        control: null,
        errors: null,
        info: {
          uuid,
        } as IDeviceInfo,
      });
    }

    const matchedInfo = this.discoveredDevices.filter((d) => d.uuid === uuid);

    if (matchedInfo[0]) {
      Object.assign(this.deviceConnections.get(uuid)!.info, matchedInfo[0]);
    }

    return this.deviceConnections.get(uuid)!;
  }

  private async createDeviceControlSocket(uuid: string) {
    const controlSocket = new Control(uuid);

    await controlSocket.connect();

    return controlSocket;
  }

  private async createDeviceControlSocketSwiftray(uuid: string) {
    const controlSocket = new SwiftrayControl(uuid);

    await controlSocket.connect();

    return controlSocket;
  }

  setDeviceControlDefaultCloseListener(deviceInfo: IDeviceInfo) {
    const { uuid } = deviceInfo;
    const device = this.deviceConnections.get(uuid);

    if (!device || !device.control) {
      console.warn(`Control socket of ${uuid} does not exist`);

      return;
    }

    const controlSocket = device.control;

    controlSocket.removeAllListeners('close');
    controlSocket.on('close', () => {
      this.closeConnection(uuid);
    });
  }

  setDeviceControlReconnectOnClose(deviceInfo: IDeviceInfo) {
    const { uuid } = deviceInfo;
    const device = this.deviceConnections.get(uuid);

    if (!device || !device.control) {
      console.warn(`Control socket of ${uuid} does not exist`);

      return;
    }

    const controlSocket = device.control;

    controlSocket.removeAllListeners('close');
    controlSocket.on('close', async () => {
      console.log(`Reconnecting ${uuid}`);

      const mode = controlSocket.getMode();
      const { isLineCheckMode, lineNumber } = controlSocket;
      const res = await this.select(deviceInfo);

      if (res && res.success) {
        if (mode === 'raw') {
          await this.enterRawMode();
          controlSocket.isLineCheckMode = isLineCheckMode;
          controlSocket.lineNumber = lineNumber;
        }

        if (device.camera !== null) {
          await this.connectCamera();
        }

        this.setDeviceControlReconnectOnClose(deviceInfo);
      } else {
        console.error('Error when reconnect to device', res.error);
        this.closeConnection(uuid);
      }
    });
  }

  async showAuthDialog(uuid: string): Promise<boolean> {
    // return authed or not
    const device = this.getDeviceByUUID(uuid);
    const { lang } = i18n;
    const authResult = await new Promise<{ data: any; password?: string; success: boolean }>((resolve) => {
      Dialog.showInputLightbox('auth', {
        caption: sprintf(lang.input_machine_password.require_password, device.info.name),
        confirmText: lang.input_machine_password.connect,
        inputHeader: lang.input_machine_password.password,
        onCancel: () => {
          resolve({ data: 'cancel', password: '', success: false });
        },
        onSubmit: async (password: string) => {
          resolve(await this.auth(device.info.uuid, password));
        },
        type: 'password',
      });
    });

    if (authResult.success && authResult.password) {
      device.info.plaintext_password = authResult.password;

      return true;
    }

    if (authResult.data !== 'cancel') {
      const message = authResult.data.reachable
        ? lang.select_device.auth_failure
        : lang.select_device.unable_to_connect;

      Alert.popById('device-auth-fail');
      Alert.popUp({
        id: 'device-auth-fail',
        message,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });

      // Display the dialog again
      const res = await this.showAuthDialog(device.info.uuid);

      return res;
    }

    return false;
  }

  async auth(uuid: string, password?: string) {
    const { lang } = i18n;

    Progress.openNonstopProgress({
      id: 'device-master-auth',
      message: lang.message.authenticating,
      timeout: 30000,
    });

    const res = await new Promise<{ data: any; password?: string; success: boolean }>((resolve) => {
      Touch({
        onError: (data: any) => {
          Progress.popById('device-master-auth');
          resolve({ data, password, success: false });
        },
        onFail: (data: any) => {
          Progress.popById('device-master-auth');
          resolve({ data, password, success: false });
        },
        onSuccess: (data: any) => {
          Progress.popById('device-master-auth');
          resolve({ data, password, success: true });
        },
      }).send(uuid, password || '');
    });

    return res;
  }

  async select(deviceInfo: IDeviceInfo): Promise<SelectionResult> {
    console.log('selecting ', deviceInfo);

    if (deviceInfo.source === 'swiftray') {
      return this.selectDeviceWithSwiftray(deviceInfo);
    }

    return this.selectDeviceWithGhost(deviceInfo);
  }

  async selectDeviceWithGhost(deviceInfo: IDeviceInfo): Promise<SelectionResult> {
    // Match the device from the newest received device list
    if (!deviceInfo || !checkSoftwareForAdor(deviceInfo)) {
      return { success: false };
    }

    const { uuid } = deviceInfo;

    // kill existing camera connection
    if (this.currentDevice?.info?.uuid !== uuid) {
      this.disconnectCamera();
    }

    const device: IDeviceConnection = this.getDeviceByUUID(uuid);

    console.log('Selecting', deviceInfo, device);
    Progress.openNonstopProgress({
      id: 'select-device',
      message: sprintf(i18n.lang.message.connectingMachine, device.info.name || deviceInfo.name),
      timeout: 30000,
    });

    if (device.control && device.control.isConnected) {
      try {
        // Update device status
        if (device.control.getMode() !== 'raw') {
          const controlSocket = device.control;
          const info = await controlSocket.addTask(controlSocket.report);

          Object.assign(device.info, info.device_status);
        }

        this.currentDevice = device;
        Progress.popById('select-device');

        return { success: true };
      } catch {
        await device.control?.killSelf();
      }
    }

    try {
      const controlSocket = await this.createDeviceControlSocket(uuid);

      device.control = controlSocket;
      this.setDeviceControlDefaultCloseListener(deviceInfo);
      this.currentDevice = device;
      console.log(`Connected to ${uuid}`);
      Progress.popById('select-device');

      return {
        success: true,
      };
    } catch (e) {
      let error = e as any;

      Progress.popById('select-device');
      console.error(error);

      if ('error' in error) {
        error = error.error;
      }

      let errorCode = '';

      if (typeof error === 'string') {
        errorCode = error.replace(/^.*:\s+(\w+)$/g, '$1').toUpperCase();
      }

      // AUTH_FAILED seems to not be used by firmware and fluxghost anymore. Keep it just in case.
      if ([ConnectionError.AUTH_ERROR, ConnectionError.AUTH_FAILED].includes(errorCode as ConnectionError)) {
        return await this.runAuthProcess(uuid, device, deviceInfo);
      }

      this.popConnectionError(uuid, errorCode as ConnectionError);

      return {
        error: errorCode as ConnectionError,
        success: false,
      };
    } finally {
      Progress.popById('select-device');
    }
  }

  async selectDeviceWithSwiftray(deviceInfo: IDeviceInfo): Promise<SelectionResult> {
    // Match the device from the newest received device list
    if (!deviceInfo) {
      return { success: false };
    }

    const { uuid } = deviceInfo;

    // kill existing camera connection
    if (this.currentDevice?.info?.uuid !== uuid) {
      this.disconnectCamera();
    }

    const device: IDeviceConnection = this.getDeviceByUUID(uuid);

    console.log('Selecting', deviceInfo, device);
    Progress.openNonstopProgress({
      id: 'select-device',
      message: sprintf(i18n.lang.message.connectingMachine, device.info.name || deviceInfo.name),
      timeout: 30000,
    });

    try {
      const controlSocket = await this.createDeviceControlSocketSwiftray(uuid);

      device.control = controlSocket;
      this.setDeviceControlDefaultCloseListener(deviceInfo);
      this.currentDevice = device;
      console.log(`Connected to ${uuid}`);

      const updateSerial = async () => {
        // In order to update serial
        const res = await swiftrayClient.listDevices();

        if (res.success) {
          const newInfo = res.devices?.find((d) => d.uuid === uuid);

          console.log('newInfo serial', newInfo?.serial);

          // Valid serial should be at least 8 characters
          if (newInfo?.serial && newInfo.serial.length >= 8) {
            device.info = newInfo;
            Object.assign(deviceInfo, newInfo);

            return true;
          }
        }

        return false;
      };

      const maxRetry = 3;

      for (let i = 0; i < maxRetry; i += 1) {
        console.log('Trying to updating serial', i);

        const res = await updateSerial();

        console.log('New device serial:', deviceInfo.serial);

        if (res) {
          break;
        }

        if (i === maxRetry - 1) {
          return { error: ConnectionError.UPDATE_SERIAL_FAILED, success: false };
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (promarkModels.has(device.info.model)) {
        const { field, galvoParameters } = promarkDataStore.get(device.info.serial);
        const { width } = getWorkarea(device.info.model);

        await this.setField(width, field);
        console.log('Applying', galvoParameters);

        if (galvoParameters) {
          await this.setGalvoParameters(galvoParameters);
        }
      }

      Progress.popById('select-device');

      return { success: true };
    } catch (e) {
      let error = e as any;

      Progress.popById('select-device');
      console.error(error);

      if ('error' in error) {
        error = error.error;
      }

      let errorCode = '';

      if (typeof error === 'string') {
        errorCode = error.replace(/^.*:\s+(\w+)$/g, '$1').toUpperCase();
      }

      // AUTH_FAILED seems to not be used by firmware and fluxghost anymore. Keep it just in case.
      if ([ConnectionError.AUTH_ERROR, ConnectionError.AUTH_FAILED].includes(errorCode as ConnectionError)) {
        return await this.runAuthProcess(uuid, device, deviceInfo);
      }

      this.popConnectionError(uuid, errorCode as ConnectionError);

      return {
        error: errorCode as ConnectionError,
        success: false,
      };
    } finally {
      Progress.popById('select-device');
    }
  }

  async runAuthProcess(uuid: string, device: IDeviceConnection, deviceInfo: IDeviceInfo): Promise<SelectionResult> {
    if (device.info.password) {
      const authed = await this.showAuthDialog(uuid);

      if (authed) {
        const selectionResultAfterAuthed = await this.select(deviceInfo);

        return selectionResultAfterAuthed;
      }

      return { success: false };
    }

    const { lang } = i18n;

    Progress.openNonstopProgress({
      id: 'select-device',
      message: sprintf(lang.message.connectingMachine, device.info.name),
      timeout: 30000,
    });

    const authResult = await this.auth(uuid);

    if (!authResult.success) {
      Progress.popById('select-device');
      Alert.popUp({
        id: 'auth-error-with-diff-computer', // ADD new error code?
        message: lang.message.auth_error,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });

      return { success: false };
    }

    const selectionResultAfterAuthed = await this.select(deviceInfo);

    return selectionResultAfterAuthed;
  }

  popConnectionError(uuid: string, errorCode: ConnectionError): void {
    const errCaption = '';
    const t = i18n.lang.message;
    let errMessage = t.unknown_error;

    switch (errorCode) {
      case ConnectionError.TIMEOUT:
        errMessage = t.connectionTimeout;
        break;
      case ConnectionError.NOT_FOUND:
        errMessage = t.unable_to_find_machine;
        break;
      case ConnectionError.DISCONNECTED:
        errMessage = `#891 ${t.disconnected}`;

        if (this.discoveredDevices.some((d) => d.uuid === uuid)) {
          errMessage = `#892 ${t.disconnected}`;
        }

        break;
      case ConnectionError.UNKNOWN_DEVICE:
        errMessage = t.unknown_device;
        break;
      default:
        errMessage = `${t.unknown_error} ${errorCode}`;
    }
    Alert.popById('connection-error');
    Alert.popUp({
      caption: errCaption,
      id: 'connection-error',
      message: errMessage,
      type: AlertConstants.SHOW_POPUP_ERROR,
    });
  }

  async getControl(): Promise<IControlSocket> {
    if (!this.currentDevice) throw new Error('No device selected');

    const controlSocket = this.currentDevice.control;

    if (controlSocket) return controlSocket;

    const res = await this.reconnect();

    if (!res.success) throw new Error('Failed to connect to device');

    return this.currentDevice.control!;
  }

  async reconnect() {
    this.deviceConnections.delete(this.currentDevice!.info.uuid);
    try {
      await this.currentDevice!.control?.killSelf();
    } catch (e) {
      console.error(`currentDevice.control.killSelf error ${e}`);
    }

    const res = await this.select(this.currentDevice!.info);

    return res;
  }

  closeConnection(uuid: string) {
    const device: IDeviceConnection = this.getDeviceByUUID(uuid);

    if (device.control) {
      try {
        // Warning: access to private property
        device.control.connection?.close();
      } catch (e) {
        console.error('Error when close control connection', e);
      }
    }

    device.control = null;
  }

  // Player functions
  async go(data: Blob, onProgress?: (...args: any[]) => void, taskTime?: number) {
    const controlSocket = await this.getControl();

    if (!data || !(data instanceof Blob)) {
      return DeviceConstants.READY;
    }

    if (onProgress) {
      controlSocket.setProgressListener(onProgress);
    }

    await controlSocket.addTask(controlSocket.upload, data);
    await controlSocket.addTask(controlSocket.start, taskTime);

    return null;
  }

  async goFromFile(path: string, fileName: string) {
    const controlSocket = await this.getControl();
    const selectResult = await controlSocket.addTask(controlSocket.select, path, fileName);

    if (selectResult.status.toUpperCase() === DeviceConstants.OK) {
      const startResult = await controlSocket.addTask(controlSocket.start);

      return startResult;
    }

    return { status: 'error' };
  }

  async resume() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.resume);
  }

  async pause() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.pause);
  }

  async stop() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.abort);
  }

  async restart() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.restart);
  }

  async quit() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.quit);
  }

  async quitTask() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.quitTask);
  }

  async kick() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.kick);
  }

  async startFraming(opt?: TPromarkFramingOpt) {
    const controlSocket = (await this.getControl()) as unknown as SwiftrayControl;

    return controlSocket.addTask(controlSocket.startFraming, opt);
  }

  async stopFraming() {
    const controlSocket = (await this.getControl()) as unknown as SwiftrayControl;

    return controlSocket.addTask(controlSocket.stopFraming);
  }

  // Calibration and Machine test functions
  async waitTillStatusPredicate({
    onProgress,
    predicate = (status) => status === DeviceConstants.status.COMPLETED,
  }: {
    onProgress?: (progress: number) => void;
    predicate?: (status: number) => boolean;
  }) {
    return new Promise((resolve, reject) => {
      const otherStatus = [
        DeviceConstants.status.ABORTED,
        DeviceConstants.status.COMPLETED,
        DeviceConstants.status.PAUSED_FROM_STARTING,
      ].filter((s) => !predicate(s));
      let statusChanged = false;

      const statusCheckInterval = setInterval(async () => {
        const controlSocket = await this.getControl();
        const r = await controlSocket.addTask(controlSocket.report);
        const { error, prog, st_id: stId } = r.device_status;

        if (predicate(stId)) {
          clearInterval(statusCheckInterval);
          await new Promise((resolve2) => setTimeout(resolve2, 1000));
          try {
            await this.quit();
            resolve(null);
          } catch (err) {
            console.error(err);
            reject(new Error('Quit failed'));
          }
        } else if (otherStatus.includes(stId) && error && error.length > 0) {
          // Error occurred
          clearInterval(statusCheckInterval);
          reject(error);
        } else if (stId === DeviceConstants.status.ABORTED) {
          clearInterval(statusCheckInterval);
          reject(error);
        } else if (stId === DeviceConstants.status.IDLE) {
          // Resolve if the status was running and some how skipped the completed part
          if (statusChanged) {
            clearInterval(statusCheckInterval);
            resolve(null);
          }
        } else {
          statusChanged = true;

          if (prog) {
            onProgress?.(prog);
          }
        }
      }, 1000);
    });
  }

  async runBeamboxCameraTest() {
    const res = await fetch('fcode/beam-series-camera.fc');
    const blob = await res.blob();
    const vc = VersionChecker(this.currentDevice!.info.version);

    if (vc.meetRequirement('RELOCATE_ORIGIN')) {
      await this.setOriginX(0);
      await this.setOriginY(0);
    }

    try {
      await this.go(blob);
    } catch {
      throw new Error('UPLOAD_FAILED');
    }

    Progress.openSteppingProgress({
      id: 'camera-cali-task',
      message: i18n.lang.calibration.drawing_calibration_image,
    });

    const onProgress = (progress: number) =>
      Progress.update('camera-cali-task', {
        percentage: Math.round(progress * 100),
      });

    try {
      await this.waitTillStatusPredicate({ onProgress });
      Progress.popById('camera-cali-task');
    } catch (err) {
      Progress.popById('camera-cali-task');
      throw err; // Error while running test
    }
  }

  async doDiodeCalibrationCut() {
    const vc = VersionChecker(this.currentDevice!.info.version);
    const fcode = vc.meetRequirement('CALIBRATION_MODE')
      ? 'fcode/beam-series-diode-c-mode.fc'
      : 'fcode/beam-series-diode.fc';
    const res = await fetch(fcode);
    const blob = await res.blob();

    if (vc.meetRequirement('RELOCATE_ORIGIN')) {
      await this.setOriginX(0);
      await this.setOriginY(0);
    }

    try {
      await this.go(blob);
    } catch {
      throw new Error('UPLOAD_FAILED');
    }

    Progress.openSteppingProgress({
      id: 'diode-cali-task',
      message: i18n.lang.calibration.drawing_calibration_image,
    });

    const onProgress = (progress: number) =>
      Progress.update('diode-cali-task', {
        percentage: Math.round(progress * 100),
      });

    try {
      await this.waitTillStatusPredicate({ onProgress });
      Progress.popById('diode-cali-task');
    } catch (err) {
      // Error while running test
      Progress.popById('diode-cali-task');
      throw err;
    }
  }

  doCalibration = async ({ blob, fcodeSource }: { blob?: Blob; fcodeSource?: string } = {}) => {
    const vc = VersionChecker(this.currentDevice!.info.version);

    if (fcodeSource) {
      const resp = await fetch(fcodeSource);

      blob = await resp.blob();
    } else if (!blob) {
      // fake data to upload for swiftray
      blob = new Blob(['']);
    }

    if (vc.meetRequirement('RELOCATE_ORIGIN')) {
      await this.setOriginX(0);
      await this.setOriginY(0);
    }

    try {
      // Stop if there is any task running
      await this.stop();
    } catch {
      // ignore
    }
    try {
      await this.go(blob);
    } catch {
      throw new Error('UPLOAD_FAILED');
    }

    Progress.openSteppingProgress({
      id: 'cali-task',
      message: i18n.lang.calibration.drawing_calibration_image,
      onCancel: async () => {
        await this.stop();
        await this.quit();
      },
    });

    const onProgress = (progress: number) => Progress.update('cali-task', { percentage: Math.round(progress * 100) });

    try {
      await this.waitTillStatusPredicate({ onProgress });
      Progress.popById('cali-task');
    } catch (err) {
      Progress.popById('cali-task');
      throw err; // Error while running test
    }
  };

  async doAdorCalibrationV2() {
    // TODO: should we remove the -v2 suffix?
    await this.doCalibration({ fcodeSource: 'fcode/ador-camera-v2.fc' });
  }

  async doAdorPrinterCalibration() {
    // using offset [0, -13.37]
    await this.doCalibration({ fcodeSource: 'fcode/ador-printer.fc' });
  }

  async doAdorIRCalibration() {
    // using offset [0, 26.95]
    await this.doCalibration({ fcodeSource: 'fcode/ador-ir.fc' });
  }

  async doBB2Calibration(type: '' | 'wide-angle' = '') {
    const fileName = match(type)
      .with('', () => 'fcode/bb2-calibration.fc')
      .with('wide-angle', () => 'fcode/bb2-calibration-wide-angle.fc')
      .exhaustive();

    await this.doCalibration({ fcodeSource: fileName });
  }

  async doHexa2Calibration(type: '' | 'wide-angle' = '') {
    const fileName = match(type)
      .with('', () => 'fcode/hx2-calibration.fc')
      .with('wide-angle', () => 'fcode/hx2-calibration-wide-angle.fc')
      .exhaustive();

    await this.doCalibration({ fcodeSource: fileName });
  }

  async doBeamo2Calibration() {
    await this.doCalibration({ fcodeSource: 'fcode/bm2-calibration.fc' });
  }

  async doBeamo24CCalibration() {
    // using offset [15.5, -37.1 + 40]
    await this.doCalibration({ fcodeSource: 'fcode/bm2-4c.fc' });
  }

  async doBeamo2IRCalibration() {
    // using offset [81.4, 7.9 + 40]
    await this.doCalibration({ fcodeSource: 'fcode/bm2-ir.fc' });
  }

  async doPromarkCalibration() {
    await this.doCalibration();
  }

  // fs functions
  async ls(path: string) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.ls, path);
  }

  async lsusb(): Promise<{
    usbs: string[];
  }> {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.lsusb) as unknown as Promise<{
      usbs: string[];
    }>;
  }

  async fileInfo(path: string, fileName: string) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.fileInfo, path, fileName);
  }

  async deleteFile(path: string, fileName: string) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.deleteFile, `${path}/${fileName}`);
  }

  async uploadToDirectory(data: Blob, path: string, fileName: string, onProgress?: (...args: any[]) => void) {
    const controlSocket = await this.getControl();

    if (onProgress) {
      controlSocket.setProgressListener(onProgress);
    }

    const res = await controlSocket.addTask(controlSocket.upload, data, path, fileName);

    return res;
  }

  async downloadFile(path: string, fileName: string, onProgress?: (...args: any[]) => void) {
    const controlSocket = await this.getControl();

    if (onProgress) {
      controlSocket.setProgressListener(onProgress);
    }

    return controlSocket.addTask(controlSocket.downloadFile, `${path}/${fileName}`, onProgress);
  }

  async downloadLog(log: string, onProgress: (...args: any[]) => void = () => {}) {
    const controlSocket = await this.getControl();

    if (onProgress) {
      controlSocket.setProgressListener(onProgress);
    }

    return controlSocket.downloadLog(log);
  }

  async fetchCameraCalibImage(fileName: string, onProgress: (...args: any[]) => void = () => {}) {
    const controlSocket = await this.getControl();

    if (onProgress) {
      controlSocket.setProgressListener(onProgress);
    }

    return controlSocket.fetchCameraCalibrateImage!(fileName);
  }

  async fetchFisheyeParams(): Promise<FisheyeCameraParameters> {
    const controlSocket = await this.getControl();

    return controlSocket.fetchFisheyeParams!() as Promise<FisheyeCameraParameters>;
  }

  async fetchFisheye3DRotation(): Promise<RotationParameters3D> {
    const controlSocket = await this.getControl();

    return controlSocket.fetchFisheye3DRotation!();
  }

  async fetchAutoLevelingData(dataType: 'bottom_cover' | 'hexa_platform' | 'offset') {
    const controlSocket = await this.getControl();

    return controlSocket.fetchAutoLevelingData!(dataType);
  }

  async getLogsTexts(logs: string[], onProgress: (...args: any[]) => void = () => {}) {
    const res: Record<string, Array<Blob | string>> = {};

    for (let i = 0; i < logs.length; i += 1) {
      const log = logs[i];

      try {
        const logFile = await this.downloadLog(log, onProgress);

        res[log] = logFile;
      } catch (e) {
        console.error(`Failed to get ${log}`, e);
      }
    }

    return res;
  }

  async endSubTask() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.endSubTask);
  }

  async enterCartridgeIOMode() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.enterSubTask, 'cartridge_io', 1000);
  }

  async getCartridgeChipData() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.getCartridgeChipData!);
  }

  async cartridgeIOJsonRpcReq(method: string, params: any[]) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.cartridgeIOJsonRpcReq!, method, params);
  }

  async enterRedLaserMeasureMode() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.enterSubTask, 'red_laser_measure');
  }

  async checkTaskAlive() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.checkTaskAlive!);
  }

  async takeReferenceZ(args: { F?: number; H?: number; X?: number; Y?: number } = {}) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.takeReferenceZ!, args);
  }

  async measureZ(args: { F?: number; X?: number; Y?: number } = {}) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.measureZ!, args);
  }

  async enterZSpeedLimitTestMode() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.enterSubTask, 'z_speed_limit_test');
  }

  async zSpeedLimitTestSetSpeed(speed: number) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.zSpeedLimitTestSetSpeed, speed);
  }

  async zSpeedLimitTestStart() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.zSpeedLimitTestStart);
  }

  // Raw mode functions
  async enterRawMode() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.enterRawMode);
  }

  async rawHome() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawHome);
  }

  async rawHomeCamera() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawHome, { cameraMode: true });
  }

  async rawHomeZ() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawHome, { zAxis: true });
  }

  async rawUnlock() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawUnlock);
  }

  rawMoveZRel = async (z: number) => {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawMoveZRel, z);
  };

  async rawMoveZRelToLastHome(z = 0) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawMoveZRelToLastHome, z);
  }

  async rawStartLineCheckMode() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawStartLineCheckMode);
  }

  async rawEndLineCheckMode() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawEndLineCheckMode);
  }

  async rawMove(args: { a?: number; f?: number; x?: number; y?: number; z?: number }) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawMove, args);
  }

  async rawWaitOkResponse(command: string, timeout?: number) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.useRawWaitOKResponse, command, timeout);
  }

  async rawSetRotary(on: boolean) {
    const controlSocket = await this.getControl();
    const fcodeVersion = constant.fcodeV2Models.has(this.currentDevice!.info.model) ? 2 : 1;

    return controlSocket.addTask(controlSocket.rawSetRotary, on, fcodeVersion);
  }

  async rawSetWaterPump(on: boolean) {
    const controlSocket = await this.getControl();
    const fcodeVersion = constant.fcodeV2Models.has(this.currentDevice!.info.model) ? 2 : 1;

    return controlSocket.addTask(controlSocket.rawSetWaterPump, on, fcodeVersion);
  }

  async rawSetFan(on: boolean) {
    const controlSocket = await this.getControl();
    const fcodeVersion = constant.fcodeV2Models.has(this.currentDevice!.info.model) ? 2 : 1;

    return controlSocket.addTask(controlSocket.rawSetFan, on, fcodeVersion);
  }

  async rawSetAirPump(on: boolean) {
    const controlSocket = await this.getControl();
    const fcodeVersion = constant.fcodeV2Models.has(this.currentDevice!.info.model) ? 2 : 1;

    return controlSocket.addTask(controlSocket.rawSetAirPump, on, fcodeVersion);
  }

  async rawLooseMotor() {
    const controlSocket = await this.getControl();
    const vc = VersionChecker(this.currentDevice!.info.version);

    if (!vc.meetRequirement('B34_LOOSE_MOTOR')) {
      // TODO: 3.3.0 is pretty old, hope we can remove this check in the future
      return controlSocket.addTask(controlSocket.rawLooseMotorOld);
    }

    const fcodeVersion = constant.fcodeV2Models.has(this.currentDevice!.info.model) ? 2 : 1;

    return controlSocket.addTask(controlSocket.rawLooseMotor, fcodeVersion);
  }

  async rawSetLaser(args: { on: boolean; s?: number }) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawSetLaser, args);
  }

  async rawSetRedLight(on: boolean) {
    if (constant.fcodeV2Models.has(this.currentDevice!.info.model)) {
      const controlSocket = await this.getControl();

      return controlSocket.addTask(controlSocket.rawSetRedLight, on);
    }

    return false;
  }

  async rawSet24V(on: boolean) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawSet24V, on);
  }

  async rawAutoFocus() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(
      controlSocket.rawAutoFocus,
      constant.fcodeV2Models.has(this.currentDevice!.info.model) ? 2 : 1,
    );
  }

  async rawGetProbePos(): Promise<{ a: number; didAf: boolean; x: number; y: number; z: number }> {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawGetProbePos);
  }

  async rawGetLastPos(): Promise<{ a: number; x: number; y: number; z: number }> {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawGetLastPos);
  }

  async rawGetStatePos(): Promise<{ a: number; x: number; y: number; z: number }> {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawGetStatePos);
  }

  async rawGetDoorOpen(): Promise<{
    backCover: number;
    bottomCover: number;
    interlock: number;
    remoteInterlock: number;
  }> {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.rawGetDoorOpen);
  }

  async rawMeasureHeight({
    baseZ,
    relZ,
    timeout = 18000,
  }: {
    baseZ?: number;
    relZ?: number;
    timeout?: number;
  }): Promise<null | number> {
    const { model } = this.currentDevice!.info;

    if (model === 'ado1') {
      await this.rawAutoFocus();

      const { didAf, z } = await this.rawGetProbePos();
      const res = didAf ? z : null;

      if (typeof baseZ === 'number') {
        await this.rawMove({ z: baseZ });
      } else if (res && relZ) {
        await this.rawMove({ z: Math.max(0, res - relZ) });
      }

      return res;
    }

    // Hexa only
    const controlSocket = await this.getControl();
    const res = await controlSocket.addTask(controlSocket.rawMeasureHeight, baseZ, timeout);

    if (res && typeof baseZ !== 'number' && relZ) {
      await this.rawMove({ z: Math.max(0, res - relZ) });
    }

    return res;
  }

  async rawSetOrigin(): Promise<null | string> {
    const controlSocket = await this.getControl();
    const vc = VersionChecker(this.currentDevice!.info.version);
    const isV2 = constant.fcodeV2Models.has(this.currentDevice!.info.model);

    if (!vc.meetRequirement(isV2 ? 'ADOR_JOB_ORIGIN' : 'JOB_ORIGIN')) {
      return null;
    }

    const res = await controlSocket.addTask(controlSocket.rawSetOrigin, isV2 ? 2 : 1);

    return res;
  }

  // Get, Set functions
  async getLaserPower() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.getLaserPower);
  }

  async setLaserPower(power: number) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.setLaserPower, power);
  }

  async setLaserPowerTemp(power: number) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.setLaserPowerTemp, power);
  }

  async getLaserSpeed() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.getLaserSpeed);
  }

  async setLaserSpeed(speed: number) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.setLaserSpeed, speed);
  }

  async setLaserSpeedTemp(speed: number) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.setLaserSpeedTemp, speed);
  }

  async getFan() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.getFan);
  }

  async setFan(fanSpeed: number) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.setFan, fanSpeed);
  }

  async setFanTemp(fanSpeed: number) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.setFanTemp, fanSpeed);
  }

  async setOriginX(x = 0) {
    const controlSocket = await this.getControl();
    const vc = VersionChecker(this.currentDevice!.info.version);

    if (vc.meetRequirement('RELOCATE_ORIGIN')) {
      return controlSocket.addTask(controlSocket.setOriginX, x);
    }

    console.warn('This device does not support command setOriginX');

    return null;
  }

  async setOriginY(y = 0) {
    const controlSocket = await this.getControl();
    const vc = VersionChecker(this.currentDevice!.info.version);

    if (vc.meetRequirement('RELOCATE_ORIGIN')) {
      return controlSocket.addTask(controlSocket.setOriginY, y);
    }

    console.warn('This device does not support command setOriginY');

    return null;
  }

  async getDoorOpen() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.getDoorOpen);
  }

  async getDeviceSetting(name: string) {
    const { currentDevice } = this;
    const controlSocket = await this.getControl();
    const res = await controlSocket.addTask(controlSocket.getDeviceSetting, name);

    if (currentDevice!.cameraNeedsFlip === null && ['camera_offset', 'camera_offset_borderless'].includes(name)) {
      if (res.status === 'ok' && !currentDevice!.info.model.includes('delta-')) {
        this.checkCameraNeedFlip(res.value);
      }
    }

    return res;
  }

  async setDeviceSetting(name: string, value: string) {
    const controlSocket = await this.getControl();

    if (value === 'delete') {
      return controlSocket.addTask(controlSocket.deleteDeviceSetting, name);
    }

    return controlSocket.addTask(controlSocket.setDeviceSetting, name, value);
  }

  async setField(worksize: number, fieldData: Field = { angle: 0, offsetX: 0, offsetY: 0 }) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.setField, worksize, fieldData);
  }

  async setGalvoParameters(data: GalvoParameters) {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.setLensCorrection, data.x, data.y);
  }

  async getDeviceDetailInfo(): Promise<IDeviceDetailInfo> {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.deviceDetailInfo);
  }

  async getReport() {
    const controlSocket = await this.getControl();
    const result = await controlSocket.addTask(controlSocket.report);
    const s = result.device_status;

    // Force update st_label for a backend inconsistancy
    if (s.st_id === DeviceConstants.status.ABORTED) {
      s.st_label = 'ABORTED';
    }

    return s;
  }

  async getPreviewInfo() {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.getPreview);
  }

  // update functions
  updateFirmware = async (file: File, type: FirmwareType, onProgress: (...args: any[]) => void) => {
    const controlSocket = await this.getControl();

    if (onProgress) {
      controlSocket.setProgressListener(onProgress);
    }

    return controlSocket.addTask(controlSocket.updateFirmware, file, type);
  };

  uploadFisheyeParams = async (data: string, onProgress: (...args: any[]) => void) => {
    const controlSocket = await this.getControl();

    if (onProgress) {
      controlSocket.setProgressListener(onProgress);
    }

    return controlSocket.addTask(controlSocket.uploadFisheyeParams!, data);
  };

  /**
   * @deprecated Use V2 calibration functions instead so we don't have to set 3d rotation
   */
  updateFisheye3DRotation = async (data: RotationParameters3D) => {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.updateFisheye3DRotation!, data);
  };

  // Camera functions
  checkCameraNeedFlip(cameraOffset: string) {
    const { currentDevice } = this;

    currentDevice!.cameraNeedsFlip = !!Number((/F:\s?(-?\d+\.?\d+)/.exec(cameraOffset) || ['', ''])[1]);

    return currentDevice!.cameraNeedsFlip;
  }

  async connectCamera(shouldCrop = true) {
    const { currentDevice } = this;

    if (currentDevice!.cameraNeedsFlip === null) {
      if (constant.fcodeV2Models.has(currentDevice!.info.model)) {
        currentDevice!.cameraNeedsFlip = false;
      } else if (currentDevice!.control && currentDevice!.control.getMode() === '') {
        await this.getDeviceSetting('camera_offset');
      }
    }

    currentDevice!.camera = new Camera(shouldCrop, currentDevice!.cameraNeedsFlip);
    await currentDevice!.camera.createWs(currentDevice!.info);
  }

  /**
   * After setting fisheyeParam the photos from machine be applied with camera matrix
   * @param setCrop defines whether to crop the photo using cx, cy
   */
  async setFisheyeMatrix(matrix: FisheyeMatrix, setCrop?: boolean) {
    const res = await this.currentDevice!.camera!.setFisheyeMatrix(matrix, setCrop);

    return res;
  }

  async setFisheyeParam(data: FisheyeCameraParameters) {
    const res = await this.currentDevice!.camera!.setFisheyeParam(data);

    return res;
  }

  async setFisheyeObjectHeight(height: number) {
    const res = await this.currentDevice!.camera!.setFisheyeObjectHeight(height);

    return res;
  }

  async setFisheyePerspectiveGrid(data: PerspectiveGrid) {
    const res = await this.currentDevice!.camera!.setFisheyePerspectiveGrid(data);

    return res;
  }

  async setFisheyeLevelingData(data: Record<string, number>) {
    const res = await this.currentDevice!.camera!.setFisheyeLevelingData(data);

    return res;
  }

  async set3dRotation(data: RotationParameters3DGhostApi) {
    const res = await this.currentDevice!.camera!.set3dRotation(data);

    return res;
  }

  async takeOnePicture({
    timeout = 30,
    useLowResolution = false,
  }: { timeout?: number; useLowResolution?: boolean } = {}): Promise<null | {
    imgBlob?: Blob;
    needCameraCableAlert?: boolean;
  }> {
    const startTime = Date.now();
    const cameraFishEyeSetting = this.currentDevice!.camera?.getFisheyeSetting();
    const fisheyeRotation = this.currentDevice!.camera?.getRotationAngles();
    let lastErr = null;

    while (Date.now() - startTime < timeout * 1000) {
      try {
        const res = await this.currentDevice!.camera!.oneShot(useLowResolution);

        if (res) {
          return res;
        }
      } catch (err) {
        console.log('Error when getting camera image', err);
        lastErr = err;
      }

      // return null result if camera is disconnected by other operation
      if (!this.currentDevice?.camera) {
        return {};
      }

      // try to reconnect camera and retake
      this.disconnectCamera();
      await this.connectCamera();

      if (cameraFishEyeSetting) {
        if (cameraFishEyeSetting.matrix) {
          await this.setFisheyeMatrix(cameraFishEyeSetting.matrix, cameraFishEyeSetting.shouldCrop);
        } else if (cameraFishEyeSetting.param) {
          await this.setFisheyeParam(cameraFishEyeSetting.param);

          if (cameraFishEyeSetting.objectHeight) {
            await this.setFisheyeObjectHeight(cameraFishEyeSetting.objectHeight);
          }

          if (cameraFishEyeSetting.levelingData) {
            await this.setFisheyeLevelingData(cameraFishEyeSetting.levelingData);
          }
        }
      }
    }

    if (fisheyeRotation) {
      await this.set3dRotation(fisheyeRotation);
    }

    if (lastErr) {
      throw lastErr;
    }

    return null;
  }

  async streamCamera(shouldCrop = true) {
    await this.connectCamera(shouldCrop);

    // return an instance of RxJS Observable.
    return this.currentDevice!.camera!.getLiveStreamSource();
  }

  disconnectCamera() {
    if (this.currentDevice?.camera) {
      this.currentDevice.camera.closeWs();
      this.currentDevice.camera = null;
    }
  }

  async getCameraCount() {
    const res = await this.currentDevice?.camera?.getCameraCount();

    return res ?? { data: 'Failed to get camera count', success: false };
  }

  setCamera(index: number) {
    return this.currentDevice?.camera?.setCamera(index) ?? false;
  }

  getCameraExposure() {
    return this.currentDevice?.camera?.getExposure() ?? null;
  }

  setCameraExposure(value: number) {
    return this.currentDevice?.camera?.setExposure(value) ?? false;
  }

  getCameraExposureAuto() {
    return this.currentDevice?.camera?.getExposureAuto() ?? null;
  }

  setCameraExposureAuto(on: boolean) {
    return this.currentDevice?.camera?.setExposureAuto(on ? 3 : 1) ?? false;
  }

  getDiscoveredDevice<T extends keyof IDeviceInfo>(
    key: T,
    value: IDeviceInfo[T],
    callback: { onSuccess: (device: IDeviceInfo) => void; onTimeout: () => void; timeout: number },
  ) {
    console.log(key, value, this.discoveredDevices);

    const matchedDevice = this.discoveredDevices.filter((d) => d[key] === value);

    if (matchedDevice.length > 0) {
      callback.onSuccess(matchedDevice[0]);

      return;
    }

    if (callback.timeout > 0) {
      setTimeout(() => {
        const newCallback = {
          ...callback,
          timeout: callback.timeout - 500,
        };

        this.getDiscoveredDevice(key, value, newCallback);
      }, 500);
    } else {
      callback.onTimeout();
    }
  }

  existDevice(serial: string) {
    return this.discoveredDevices.some((device) => device.serial === serial);
  }

  public adjustZAxis = async (z: number) => {
    const blob: Blob = new Blob([`M103\nM3\nM102\nZ${z}\nM2\n`]);

    await this.go(blob);
  };

  public checkButton = async () => {
    const controlSocket = await this.getControl();

    return controlSocket.addTask(controlSocket.checkButton);
  };
}

const deviceMaster = new DeviceMaster();

export default deviceMaster;
