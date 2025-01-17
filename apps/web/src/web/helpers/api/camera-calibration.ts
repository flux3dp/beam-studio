/**
 * API camera calibration
 * Ref: none
 */
import { FisheyeCaliParameters, FisheyeCameraParametersV2Cali } from 'interfaces/FisheyePreview';

import Websocket from '../websocket';

class CameraCalibrationApi {
  private ws: any; // websocket

  private events: {
    onMessage: (response: any) => void;
    onError: (response: any) => void;
    onFatal: (response: any) => void;
  };

  constructor() {
    this.events = {
      onMessage: () => {},
      onError: () => {},
      onFatal: () => {},
    };

    this.ws = Websocket({
      method: 'camera-calibration',
      onMessage: (data) => {
        this.events.onMessage(data);
      },
      onError: (response) => {
        this.events.onError(response);
      },
      onFatal: (response) => {
        this.events.onFatal(response);
      },
    });
  }

  upload(data: Blob | ArrayBuffer): Promise<any> {
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

  addFisheyeCalibrateImg(height: number, img: Blob | ArrayBuffer): Promise<boolean> {
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
            if (onProgress) onProgress(response.progress);
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
    img: Blob | ArrayBuffer,
    height: number,
    chessboard = [48, 36]
  ): Promise<
    | {
        success: true;
        blob: Blob;
        data: {
          ret: number;
          k: number[][];
          d: number[][];
          rvec: number[];
          tvec: number[];
        };
      }
    | { success: false; data: { reason: string } }
  > {
    return new Promise((resolve, reject) => {
      let blob: Blob;
      this.events.onMessage = (response) => {
        if (response instanceof Blob) {
          blob = response;
        } else if (response.status === 'continue') {
          this.ws.send(img);
        } else if (response.status === 'fail') {
          resolve({ success: false, data: { reason: response.reason } });
        } else if (response.status.toLowerCase?.() === 'error') {
          console.log('error', response);
          resolve({ success: false, data: { reason: response.message } });
        } else if (response.status === 'ok') {
          const { status, ...rest } = response;
          resolve({ success: true, blob, data: rest });
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

  findCorners(
    img: Blob | ArrayBuffer,
    withPitch = false
  ): Promise<{
    success: boolean;
    blob: Blob;
    data?: {
      ret: number;
      k: number[][];
      d: number[][];
      rvec: number[];
      tvec: number[];
    };
  }> {
    return new Promise((resolve, reject) => {
      let success = true;
      let data = {} as {
        ret: number;
        k: number[][];
        d: number[][];
        rvec: number[];
        tvec: number[];
      };
      this.events.onMessage = (response) => {
        if (response instanceof Blob) {
          resolve({ success, blob: response, data });
        } else if (response.status === 'continue') {
          this.ws.send(img);
        } else if (response.status === 'fail') {
          success = false;
          console.log('fail', response);
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
      // corner_detection [camera_pitch] [file_length] [calibration_version]
      this.ws.send(`corner_detection ${withPitch ? 20 : 0} ${size} 2`);
    });
  }

  solvePnPFindCorners = (
    img: Blob | ArrayBuffer,
    dh: number,
    refPoints: [number, number][],
    interestArea?: { x: number; y: number; width: number; height: number }
  ): Promise<
    | {
        success: true;
        blob: Blob;
        data?: { points: [number, number][] };
      }
    | {
        success: false;
        blob: null;
        data: { status: string; info: string; reason: string };
      }
  > =>
    new Promise((resolve, reject) => {
      let data = {} as { points: [number, number][] };
      this.events.onMessage = (response) => {
        if (response instanceof Blob) {
          resolve({ success: true, blob: response, data });
        } else if (response.status === 'continue') {
          this.ws.send(img);
        } else if (response.status === 'fail') {
          console.log('fail', response);
          resolve({ success: false, blob: null, data: response });
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
      if (interestArea) args.push(JSON.stringify(interestArea));
      // solve_pnp_find_corners [refPoints] [elevated_dh] [file_length] [interest_area]
      this.ws.send(`solve_pnp_find_corners ${args.filter((arg) => arg !== undefined).join(' ')}`);
    });

  solvePnPCalculate = (
    dh: number,
    points: [number, number][],
    refPoints: [number, number][]
  ): Promise<{
    success: boolean;
    data?: { rvec: number[]; tvec: number[] };
  }> =>
    new Promise((resolve, reject) => {
      let success = true;
      let data = {} as { rvec: number[]; tvec: number[] };
      this.events.onMessage = (response) => {
        if (response.status === 'fail') {
          success = false;
          console.log('fail', response);
        } else if (response.status === 'ok') {
          const { status, ...rest } = response;
          data = rest;
          resolve({ success, data });
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
      this.ws.send(
        `solve_pnp_calculate ${JSON.stringify(refPoints)} ${dh.toFixed(3)} ${JSON.stringify(
          points
        )}`
      );
    });

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
    rvecs: number[][],
    tvecs: number[][],
    heights: number[]
  ): Promise<{
    success: boolean;
    data?: { rvec_polyfit: number[][]; tvec_polyfit: number[][] };
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
          resolve({ success, data });
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
}

export default CameraCalibrationApi;
