/**
 * API camera
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-camera(monitoring)
 */
import PQueue from 'p-queue';
import type { Observable } from 'rxjs';
import { EmptyError, from, lastValueFrom, partition, Subject } from 'rxjs';
import { concatMap, filter, map, take, timeout } from 'rxjs/operators';

import constant from '@core/app/actions/beambox/constant';
import Progress from '@core/app/actions/progress-caller';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import i18n from '@core/helpers/i18n';
import rsaKey from '@core/helpers/rsa-key';
import VersionChecker from '@core/helpers/version-checker';
import Websocket from '@core/helpers/websocket';
import type {
  FisheyeCameraParameters,
  FisheyeMatrix,
  PerspectiveGrid,
  RotationParameters3DGhostApi,
} from '@core/interfaces/FisheyePreview';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const TIMEOUT = 120000;
const IMAGE_TRANSMISSION_FAIL_THRESHOLD = 20;
const CAMERA_CABLE_ALERT_THRESHOLD = 10;

const checkBlobIsImage = (blob: Blob, failTime = 3000) =>
  new Promise<boolean>((resolve) => {
    const img = new Image();
    const imgUrl = URL.createObjectURL(blob);
    let resolved = false;
    const resolveAndCleanUp = (result: boolean) => {
      resolved = true;
      URL.revokeObjectURL(imgUrl);
      resolve(result);
    };
    const failTimer = setTimeout(() => {
      if (!resolved) {
        resolveAndCleanUp(false);
      }
    }, failTime);

    img.onload = () => {
      if (!resolved) {
        resolveAndCleanUp(true);
        clearTimeout(failTimer);
      }
    };
    img.src = imgUrl;
  });

class Camera {
  cameraNeedFlip: boolean | null = null;

  shouldCrop: boolean;

  private device: {
    model: null | string;
    source: null | string;
    uuid: null | string;
    version: null | string;
  };
  private ws: any;
  private wsSubject: Subject<Blob | { status: string }>;
  private source: Observable<{ imgBlob: Blob; needCameraCableAlert: boolean }>;
  private nonBinarySource: Observable<{ status: string }>;
  private requireFrameRetry: number;
  private fishEyeSetting: null | {
    levelingData?: Record<string, number>;
    matrix?: FisheyeMatrix;
    objectHeight?: number;
    param?: FisheyeCameraParameters;
    shouldCrop?: boolean;
  } = null;
  private rotationAngles?: RotationParameters3DGhostApi;
  private lastRequireCommand = '';
  private commandQueue: PQueue;

  constructor(shouldCrop = true, cameraNeedFlip: boolean | null = null) {
    this.commandQueue = new PQueue({ concurrency: 1 });
    this.shouldCrop = shouldCrop;
    this.device = {
      model: null,
      source: null,
      uuid: null,
      version: null,
    };

    if (cameraNeedFlip !== null) {
      this.cameraNeedFlip = cameraNeedFlip;
    }

    this.ws = null;
    this.requireFrameRetry = 0;
    this.wsSubject = new Subject<Blob | { status: string }>();

    const [binary, nonBinary] = partition(this.wsSubject.asObservable(), (x) => x instanceof Blob);

    this.source = binary
      .pipe(
        map(async (blob: Blob) => {
          const isImage = await checkBlobIsImage(blob);
          const t = i18n.lang.message;

          if (!isImage) {
            if (!Progress.checkIdExist('connect-camera')) {
              Progress.openNonstopProgress({
                id: 'connect-camera',
                message: t.connectingCamera,
                timeout: TIMEOUT,
              });
            }

            if (this.requireFrameRetry < IMAGE_TRANSMISSION_FAIL_THRESHOLD) {
              setTimeout(() => this.ws.send(this.lastRequireCommand || 'require_frame'), 500);
              this.requireFrameRetry += 1;

              return null;
            }

            Progress.popById('connect-camera');
            throw new Error(t.camera.fail_to_transmit_image);
          }

          Progress.popById('connect-camera');

          const needCameraCableAlert = this.requireFrameRetry >= CAMERA_CABLE_ALERT_THRESHOLD;

          this.requireFrameRetry = 0;

          const imgBlob = await this.preprocessImage(blob);

          return { imgBlob, needCameraCableAlert };
        }),
      )
      .pipe(concatMap((p) => from(p)))
      .pipe(filter((res) => res !== null));
    this.nonBinarySource = nonBinary as Observable<{ status: string }>;
  }

  // let subject get response from websocket
  async createWs(device: IDeviceInfo): Promise<void> {
    this.device = device;
    console.log('Device ', device);
    console.assert(device.version, 'device miss version!', device);

    const method = device.source === 'h2h' ? `camera/usb/${Number.parseInt(device.uuid, 10)}` : `camera/${device.uuid}`;

    this.ws = Websocket({
      autoReconnect: false,
      method,
      onClose: () => this.wsSubject.complete(),
      onError: (res) => this.wsSubject.error(new Error(`Camera WS ${res.error ? res.error.toString() : res}`)),
      onFatal: (res) => this.wsSubject.error(new Error(`Camera WS ${res.error ? res.error.toString() : res}`)),
      onMessage: (res) => this.wsSubject.next(res),
      onOpen: () => this.ws.send(rsaKey()),
    });

    // if response.status === 'connected' within TIMEOUT,
    // the promise resolve. and the websocket will keep listening.
    await lastValueFrom(
      this.wsSubject
        .pipe(filter((res) => !(res instanceof Blob) && res.status === 'connected'))
        .pipe(take(1))
        .pipe(timeout(TIMEOUT)),
    );

    // check whether the camera need flip
    if (this.cameraNeedFlip === null && device && !device.model.includes('delta-')) {
      this.cameraNeedFlip = !!Number((/F:\s?(-?\d+\.?\d+)/.exec(await this.getCameraOffset()) || ['', ''])[1]);
    }
  }

  async getCameraOffset(): Promise<string> {
    console.warn('This is additional control socket created in camera.ts, this may take unnecessary time.');

    const tempWsSubject = new Subject<{ error?: Error; status: string; value: string }>();
    const tempWs = Websocket({
      autoReconnect: false,
      method: this.device.source === 'h2h' ? `control/usb/${this.device.uuid}` : `control/${this.device.uuid}`,
      onClose: () => tempWsSubject.complete(),
      onError: (res) => tempWsSubject.error(new Error(res.error ? res.error.toString() : res)),
      onFatal: (res) => tempWsSubject.error(new Error(res.error ? res.error.toString() : res)),
      onMessage: (res) => tempWsSubject.next(res),
      onOpen: () => tempWs.send(rsaKey()),
    });

    await lastValueFrom(
      tempWsSubject
        .pipe(filter((res) => res.status === 'connected'))
        .pipe(take(1))
        .pipe(timeout(TIMEOUT)),
    );

    tempWs.send('config get camera_offset');

    const cameraOffset = await lastValueFrom(tempWsSubject.pipe(take(1)).pipe(timeout(TIMEOUT)));

    console.log(cameraOffset);

    return cameraOffset.value;
  }

  getFisheyeSetting = () => this.fishEyeSetting;

  getRotationAngles = (): RotationParameters3DGhostApi | undefined => this.rotationAngles;

  sendCommandWithNonBinaryResult = async <T = { data?: string; error?: string; status: string; success?: boolean }>(
    command: string,
  ): Promise<T> => {
    return this.commandQueue.add(() => {
      this.ws.send(command);

      return lastValueFrom(this.nonBinarySource.pipe(take(1)).pipe(timeout(TIMEOUT))) as T;
    });
  };

  getCameraCount = async (): Promise<{ data: number; success: true } | { data: string; success: false }> => {
    const { data, error, success } = await this.sendCommandWithNonBinaryResult('get_camera_count');

    if (!success) return { data: data ?? error ?? 'Unknown Error', success: false };

    const count = Number(data!.split(':').at(-1));

    return { data: count, success };
  };

  setCamera = async (index: number): Promise<boolean> => {
    const { data, success } = await this.sendCommandWithNonBinaryResult(`set_camera ${index}`);

    if (!success) return false;

    const res = data?.split(':').at(-1);

    return res?.toLowerCase().endsWith('ok') || false;
  };

  getExposure = async (): Promise<{ data: number; success: true } | { data: string; success: false }> => {
    const { data, error, success } = await this.sendCommandWithNonBinaryResult('send_text get_exposure');

    if (!success) return { data: data ?? error ?? 'Unknown Error', success: false };

    const value = Number(data!.split(':').at(-1));

    return { data: value, success };
  };

  setExposure = async (value: number): Promise<boolean> => {
    const { data, success } = await this.sendCommandWithNonBinaryResult(`send_text set_exposure:${value}`);

    if (!success) return false;

    const res = data?.split(':').at(-1);

    return res?.toLowerCase().endsWith('ok') || false;
  };

  getExposureAuto = async (): Promise<{ data: boolean; success: true } | { data: string; success: false }> => {
    const { data, error, success } = await this.sendCommandWithNonBinaryResult('send_text get_exposure_auto');

    if (!success) return { data: data ?? error ?? 'Unknown Error', success: false };

    const value = Number(data!.split(':').at(-1)) === 3;

    return { data: value, success };
  };

  setExposureAuto = async (value: number): Promise<boolean> => {
    const { data, success } = await this.sendCommandWithNonBinaryResult(`send_text set_exposure_auto:${value}`);

    if (!success) return false;

    const res = data?.split(':').at(-1);

    return res?.toLowerCase().endsWith('ok') || false;
  };

  setFisheyeMatrix = async (mat: FisheyeMatrix, setCrop = false): Promise<boolean> => {
    this.fishEyeSetting = { matrix: mat, shouldCrop: setCrop };

    const { center, ...matrix } = { ...mat };
    const [cx, cy] = center || [];
    const matrixString = JSON.stringify(matrix, (key, val) => {
      if (typeof val === 'number') {
        return Math.round(val * 1e6) / 1e6;
      }

      return val;
    });

    let res = await this.sendCommandWithNonBinaryResult(`set_fisheye_matrix ${matrixString}`);

    if (!setCrop) {
      return res.status === 'ok';
    }

    const { model } = this.device;
    const workarea = getWorkarea(model as WorkAreaModel);
    const { cameraCenter, displayHeight, height, width } = workarea;
    const cropParam: { [key: string]: number } = { cx, cy, height: displayHeight ?? height, width };

    if (cameraCenter) {
      [cropParam.left, cropParam.top] = cameraCenter;
    }

    const cropParamString = JSON.stringify(cropParam);

    res = await this.sendCommandWithNonBinaryResult(`set_crop_param ${cropParamString}`);

    return res.status === 'ok';
  };

  setFisheyeParam = async (param: FisheyeCameraParameters): Promise<boolean> => {
    this.fishEyeSetting = { ...this.fishEyeSetting, param };

    const data = JSON.stringify(param, (key, val) => {
      if (typeof val === 'number') {
        return Math.round(val * 1e6) / 1e6;
      }

      return val;
    });

    const res = await this.sendCommandWithNonBinaryResult(`set_fisheye_matrix ${data}`);

    return res.status === 'ok';
  };

  setFisheyeObjectHeight = async (h: number): Promise<boolean> => {
    this.fishEyeSetting = { ...this.fishEyeSetting, objectHeight: h };

    const res = await this.sendCommandWithNonBinaryResult(`set_fisheye_height ${h.toFixed(3)}`);

    return res.status === 'ok';
  };

  setFisheyePerspectiveGrid = async (data: PerspectiveGrid): Promise<boolean> => {
    const dataStr = JSON.stringify(data);

    const res = await this.sendCommandWithNonBinaryResult(`set_fisheye_grid ${dataStr}`);

    return res.status === 'ok';
  };

  setFisheyeLevelingData = async (data: Record<string, number>): Promise<boolean> => {
    this.fishEyeSetting = { ...this.fishEyeSetting, levelingData: data };

    const strData = JSON.stringify(data, (key, val) => {
      if (typeof val === 'number') {
        return Math.round(val * 1e3) / 1e3;
      }

      return val;
    });

    const res = await this.sendCommandWithNonBinaryResult(`set_leveling_data ${strData}`);

    return res.status === 'ok';
  };

  // set 3d rotation angles, rx, ry, rz is rotation angle in degree, h is height in mm
  set3dRotation = async (data: RotationParameters3DGhostApi): Promise<boolean> => {
    this.rotationAngles = { ...data };

    const radiusData = {
      h: data.h,
      rx: (data.rx * Math.PI) / 180,
      ry: (data.ry * Math.PI) / 180,
      rz: (data.rz * Math.PI) / 180,
      tx: data.tx,
      ty: data.ty,
    };
    const dataString = JSON.stringify(radiusData, (key, val) => {
      if (typeof val === 'number') {
        return Math.round(val * 1e3) / 1e3;
      }

      return val;
    });

    const res = await this.sendCommandWithNonBinaryResult(`set_3d_rotation ${dataString}`);

    return res.status === 'ok';
  };

  async sendOneShot(useLowResolution = true): Promise<{ imgBlob: Blob; needCameraCableAlert: boolean }> {
    try {
      this.lastRequireCommand = useLowResolution ? 'require_frame l' : 'require_frame';
      this.ws.send(this.lastRequireCommand);

      const data = await lastValueFrom(this.source.pipe(take(1)).pipe(timeout(TIMEOUT)));

      return data;
    } catch (error) {
      console.error('Fail to oneshot', error);

      const t = i18n.lang.message;

      if (error instanceof EmptyError) {
        error.message = `${t.camera.fail_to_transmit_image} ${error.message}`;
        throw error;
      } else {
        throw new TypeError(`${t.camera.ws_closed_unexpectedly} ${(error as any).message}`);
      }
    }
  }

  oneShot = async (useLowResolution = true): Promise<{ imgBlob: Blob; needCameraCableAlert: boolean }> => {
    return this.commandQueue.add(() => this.sendOneShot(useLowResolution));
  };

  getLiveStreamSource() {
    this.ws.send('enable_streaming');

    return this.source.pipe(timeout(TIMEOUT));
  }

  closeWs(): void {
    this.ws.close(false);
  }

  async preprocessImage(blob: Blob) {
    // load blob and flip if necessary
    const imageLoadBlob = async () => {
      const img = new Image();
      const imgUrl = URL.createObjectURL(blob);

      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imgUrl;
      });
      URL.revokeObjectURL(imgUrl);

      const canvas = document.createElement('canvas');

      canvas.width = img.width;
      canvas.height = img.height;

      if (this.cameraNeedFlip) {
        canvas.getContext('2d')!.scale(-1, -1);
        canvas.getContext('2d')!.drawImage(img, -img.width, -img.height, img.width, img.height);
      } else {
        canvas.getContext('2d')!.drawImage(img, 0, 0, img.width, img.height);
      }

      return canvas;
    };
    const resize1280x720ImageTo640x280 = async () => {
      const img = await imageLoadBlob();

      console.assert(img.width === 1280 && img.height === 720, 'image should be 1280x720', img.width, img.height);

      const canvas = document.createElement('canvas');

      canvas.width = 640;
      canvas.height = 280;
      canvas.getContext('2d')!.drawImage(img, 0, -40, 640, 360); // resize

      const preprocessedBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!)));

      return preprocessedBlob;
    };

    const crop640x480ImageTo640x280 = async () => {
      const img = await imageLoadBlob();

      console.assert(img.width === 640 && img.height === 480, 'image should be 640x480', img.width, img.height);

      const canvas = document.createElement('canvas');

      canvas.width = 640;
      canvas.height = 280;
      canvas.getContext('2d')!.drawImage(img, 0, -100, 640, 480); // crop top and bottom

      const preprocessedBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!)));

      return preprocessedBlob;
    };

    const loadAndFlipImage = async () => {
      const canvas = await imageLoadBlob();
      const preprocessedBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!)));

      return preprocessedBlob;
    };

    if (constant.adorModels.includes(this.device.model!)) {
      return blob;
    }

    if (
      !['darwin-dev', 'fbb1b', 'fbb1p', 'fbm1', 'fhexa1', 'laser-b1', 'laser-b2', 'mozu1'].includes(this.device.model!)
    ) {
      return blob;
    }

    if (!this.shouldCrop) {
      const data = await loadAndFlipImage();

      return data;
    }

    if (VersionChecker(this.device.version!).meetRequirement('BEAMBOX_CAMERA_SPEED_UP')) {
      const data = await crop640x480ImageTo640x280();

      return data;
    }

    const data = await resize1280x720ImageTo640x280();

    return data;
  }
}

export default Camera;
