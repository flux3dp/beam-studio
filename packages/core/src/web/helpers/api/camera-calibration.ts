/* eslint-disable ts/no-unused-vars */
/**
 * API camera calibration
 * Ref: none
 */
import type {
  FisheyeCaliParameters,
  FisheyeCameraParametersV2Cali,
  PerspectiveGrid,
} from '@core/interfaces/FisheyePreview';

import Websocket from '../websocket';

class CameraCalibrationApi {
  private ws: any; // websocket

  private events: {
    onError: (response: any) => void;
    onFatal: (response: any) => void;
    onMessage: (response: any) => void;
  };

  constructor() {
    this.events = {
      onError: () => {},
      onFatal: () => {},
      onMessage: () => {},
    };

    this.ws = Websocket({
      method: 'camera-calibration',
      onError: (response) => {
        this.events.onError(response);
      },
      onFatal: (response) => {
        this.events.onFatal(response);
      },
      onMessage: (data) => {
        this.events.onMessage(data);
      },
    });
  }

  upload(data: ArrayBuffer | Blob): Promise<any> {
    return new Promise((resolve, reject) => {
      this.events.onMessage = (response) => {
        switch (response.status) {
          case 'ok':
            resolve(response);
            break;
          case 'fail':
            resolve(response);
            break;
          case 'none':
            resolve(response);
            break;
          case 'continue':
            this.ws.send(data);
            break;
          default:
            console.log('strange message', response);
            break;
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };

      const size = data instanceof Blob ? data.size : data.byteLength;

      this.ws.send(`upload ${size}`);
    });
  }

  startFisheyeCalibrate(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.events.onMessage = (response) => {
        switch (response.status) {
          case 'ok':
            resolve(true);
            break;
          default:
            console.log('strange message', response);
            break;
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };
      this.ws.send('start_fisheye_calibration');
    });
  }

  addFisheyeCalibrateImg(height: number, img: ArrayBuffer | Blob): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.events.onMessage = (response) => {
        switch (response.status) {
          case 'ok':
            resolve(true);
            break;
          case 'continue':
            this.ws.send(img);
            break;
          default:
            console.log('strange message', response);
            break;
        }
      };

      this.events.onError = (response) => {
        resolve(false);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        resolve(false);
        console.log('on fatal', response);
      };

      const size = img instanceof Blob ? img.size : img.byteLength;

      this.ws.send(`add_fisheye_calibration_image ${size} ${height}`);
    });
  }

  doFisheyeCalibration(onProgress?: (val: number) => void): Promise<FisheyeCameraParametersV2Cali> {
    return new Promise((resolve, reject) => {
      this.events.onMessage = (response) => {
        switch (response.status) {
          case 'ok':
            resolve(response);
            break;
          case 'progress':
            if (onProgress) {
              onProgress(response.progress);
            }

            break;
          case 'fail':
            reject(response.reason);
            break;
          default:
            console.log('strange message', response);
            break;
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };
      this.ws.send('do_fisheye_calibration');
    });
  }

  calibrateChessboard(
    img: ArrayBuffer | Blob,
    height: number,
    chessboard = [48, 36],
  ): Promise<
    | {
        blob: Blob;
        data: {
          d: number[][];
          k: number[][];
          ret: number;
          rvec: number[][];
          tvec: number[][];
        };
        success: true;
      }
    | { data: { reason: string }; success: false }
  > {
    return new Promise((resolve, reject) => {
      let blob: Blob;

      this.events.onMessage = (response) => {
        if (response instanceof Blob) {
          blob = response;
        } else if (response.status === 'continue') {
          this.ws.send(img);
        } else if (response.status === 'fail') {
          resolve({ data: { reason: response.reason }, success: false });
        } else if (response.status.toLowerCase?.() === 'error') {
          console.log('error', response);
          resolve({ data: { reason: response.message }, success: false });
        } else if (response.status === 'ok') {
          const { status, ...rest } = response;

          resolve({ blob, data: rest, success: true });
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };

      const size = img instanceof Blob ? img.size : img.byteLength;

      // calibrate_chessboard [file_length] [height] [chessboard_w] [chessboard_h]
      this.ws.send(`calibrate_chessboard ${size} ${height.toFixed(2)} ${chessboard.join(' ')}`);
    });
  }

  solvePnPFindCorners = (
    img: ArrayBuffer | Blob,
    dh: number,
    refPoints: Array<[number, number]>,
    interestArea?: { height: number; width: number; x: number; y: number },
  ): Promise<
    | {
        blob: Blob;
        data: { points: Array<[number, number]> };
        success: true;
      }
    | {
        blob: null;
        data: { info: string; reason: string; status: string };
        success: false;
      }
  > =>
    new Promise((resolve, reject) => {
      let data = {} as { points: Array<[number, number]> };

      this.events.onMessage = (response) => {
        if (response instanceof Blob) {
          resolve({ blob: response, data, success: true });
        } else if (response.status === 'continue') {
          this.ws.send(img);
        } else if (response.status === 'fail') {
          console.log('fail', response);
          resolve({ blob: null, data: response, success: false });
        } else if (response.status === 'ok') {
          const { status, ...rest } = response;

          data = rest;
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };

      const size = img instanceof Blob ? img.size : img.byteLength;
      // TODO: change args to object to avoid fixed order arguments
      const args = [JSON.stringify(refPoints), dh.toFixed(3), size];

      if (interestArea) {
        args.push(JSON.stringify(interestArea));
      }

      // solve_pnp_find_corners [refPoints] [elevated_dh] [file_length] [interest_area]
      this.ws.send(`solve_pnp_find_corners ${args.filter((arg) => arg !== undefined).join(' ')}`);
    });

  solvePnPCalculate = (
    dh: number,
    points: Array<[number, number]>,
    refPoints: Array<[number, number]>,
  ): Promise<{
    data: { rvec: number[][]; tvec: number[][] };
    success: boolean;
  }> =>
    new Promise((resolve, reject) => {
      let success = true;
      let data = {} as { rvec: number[][]; tvec: number[][] };

      this.events.onMessage = (response) => {
        if (response.status === 'fail') {
          success = false;
          console.log('fail', response);
        } else if (response.status === 'ok') {
          const { status, ...rest } = response;

          data = rest;
          resolve({ data, success });
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };
      // solve_pnp_calculate [ref_points] [elevated_dh] [points]
      this.ws.send(`solve_pnp_calculate ${JSON.stringify(refPoints)} ${dh.toFixed(3)} ${JSON.stringify(points)}`);
    });

  checkPnP = (
    img: ArrayBuffer | Blob,
    dh: number,
    params: { d: number[][]; k: number[][] } & (
      | { rvec: number[][]; tvec: number[][] }
      | { rvecs: Record<string, number[][]>; tvecs: Record<string, number[][]> }
    ),
    grid: PerspectiveGrid,
  ): Promise<
    { blob: Blob; success: true } | { data: { info: string; reason: string; status: string }; success: false }
  > =>
    new Promise((resolve, reject) => {
      this.events.onMessage = (response) => {
        if (response instanceof Blob) {
          resolve({ blob: response, success: true });
        } else if (response.status === 'continue') {
          this.ws.send(img);
        } else if (response.status === 'fail') {
          console.log('fail', response);
          resolve({ data: response, success: false });
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };

      const size = img instanceof Blob ? img.size : img.byteLength;
      const args = JSON.stringify({ dh, grid, params, size });

      this.ws.send(`check_pnp ${args}`);
    });

  remapImage = (img: ArrayBuffer | Blob, params?: { d: number[][]; k: number[][] }): Promise<{ blob: Blob }> => {
    return new Promise((resolve, reject) => {
      this.events.onMessage = (response) => {
        if (response instanceof Blob) {
          resolve({ blob: response });
        } else if (response.status === 'continue') {
          this.ws.send(img);
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };

      const size = img instanceof Blob ? img.size : img.byteLength;
      const args = JSON.stringify({ params, size });

      this.ws.send(`remap_image ${args}`);
    });
  };

  updateData = (data: FisheyeCaliParameters): Promise<boolean> =>
    new Promise((resolve, reject) => {
      this.events.onMessage = (response) => {
        if (response.status === 'ok') {
          resolve(true);
        } else {
          reject(response);
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };
      // update_data [data]
      this.ws.send(`update_data ${JSON.stringify(data)}`);
    });

  extrinsicRegression = (
    rvecs: number[][][],
    tvecs: number[][][],
    heights: number[],
  ): Promise<{
    data?: { rvec_polyfit: number[][]; tvec_polyfit: number[][] };
    success: boolean;
  }> =>
    new Promise((resolve, reject) => {
      let success = true;
      let data = {} as { rvec_polyfit: number[][]; tvec_polyfit: number[][] };

      this.events.onMessage = (response) => {
        if (response.status === 'fail') {
          success = false;
          console.log('fail', response);
        } else if (response.status === 'ok') {
          const { status, ...rest } = response;

          data = rest;
          resolve({ data, success });
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };

      // extrinsic_regression [rvecs] [tvecs] [heights]
      const rvecsStr = JSON.stringify(rvecs);
      const tvecsStr = JSON.stringify(tvecs);
      const heightsStr = JSON.stringify(heights);

      this.ws.send(`extrinsic_regression ${rvecsStr} ${tvecsStr} ${heightsStr}`);
    });
  detectChAruCo = (
    img: ArrayBuffer | Blob,
    squareX: number,
    squareY: number,
  ): Promise<
    { imgp: number[][]; objp: number[][]; ratio: number; success: true } | { reason: string; success: false }
  > =>
    new Promise((resolve, reject) => {
      this.events.onMessage = (response) => {
        if (response.status === 'continue') {
          this.ws.send(img);
        } else if (response.status === 'fail') {
          console.log('fail', response);
          resolve({ reason: response.reason, success: false });
        } else if (response.status === 'ok') {
          const { status, ...rest } = response;

          resolve({ ...rest, success: true });
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };

      const size = img instanceof Blob ? img.size : img.byteLength;
      const args = [size, squareX, squareY];

      // detect_charuco [file_length] [squareX] [squareY]
      this.ws.send(`detect_charuco ${args.filter((arg) => arg !== undefined).join(' ')}`);
    });
  calibrateCamera = (
    objPoints: number[][][],
    imgPoints: number[][][],
    imageSize: number[],
    isFisheye = true,
  ): Promise<
    | {
        d: number[][];
        indices: number[];
        k: number[][];
        ret: number;
        rvec: number[][];
        success: true;
        tvec: number[][];
      }
    | { reason: string; success: false }
  > =>
    new Promise((resolve, reject) => {
      this.events.onMessage = (response) => {
        if (response.status === 'fail') {
          console.log('fail', response);
          resolve({ reason: response.reason, success: false });
        } else if (response.status === 'ok') {
          const { status, ...rest } = response;

          resolve({ ...rest, success: true });
        }
      };

      this.events.onError = (response) => {
        reject(response);
        console.log('on error', response);
      };
      this.events.onFatal = (response) => {
        reject(response);
        console.log('on fatal', response);
      };

      const objPointsStr = JSON.stringify(objPoints);
      const imgPointsStr = JSON.stringify(imgPoints);
      const imageSizeStr = JSON.stringify(imageSize);

      if (isFisheye) {
        // TODO: calibrate_fisheye is deprecated, can use calibrate after ghost for firmware updated
        this.ws.send(`calibrate_fisheye ${objPointsStr} ${imgPointsStr} ${imageSizeStr}`);
      } else {
        this.ws.send(`calibrate_camera ${objPointsStr} ${imgPointsStr} ${imageSizeStr} ${isFisheye}`);
      }
    });
}

export const cameraCalibrationApi = new CameraCalibrationApi();

export default CameraCalibrationApi;
