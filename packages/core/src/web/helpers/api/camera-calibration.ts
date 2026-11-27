/* eslint-disable ts/no-unused-vars */
/**
 * API camera calibration
 * Ref: none
 */
import PQueue from 'p-queue';

import type {
  FisheyeCaliParameters,
  FisheyeCameraParametersV2Cali,
  PerspectiveGrid,
} from '@core/interfaces/FisheyePreview';

import Websocket from '../websocket';

/** [x, y, size, contrast], x / y in the remapped-image px space `solvePnPCalculate` takes */
export type AutoPnPBlob = [number, number, number, number];

export type AutoPnPFailReason = 'HIGH_RESIDUAL' | 'NOT_ENOUGH_MARKS' | 'UNSUPPORTED';

/**
 * fluxghost answers a command it does not know with `{ status: 'Error', message: 'BAD_PARAM_TYPE' }`. The
 * capital E matters: the websocket wrapper only routes the lowercase `error` to onError, so this one arrives
 * as an ordinary message and has to be recognised here, or the caller waits forever.
 */
const isUnknownCommand = (response: { status?: string }): boolean => response.status === 'Error';

// A reply that never comes must not hold the queue for good. Matching can take most of a minute on a photo full
// of strays; the two calibrations work through a whole photo set.
const COMMAND_TIMEOUT_MS = 2 * 60 * 1000;
const LONG_COMMAND_TIMEOUT_MS = 10 * 60 * 1000;

class CameraCalibrationApi {
  private ws: any; // websocket

  private events: {
    onError: (response: any) => void;
    onFatal: (response: any) => void;
    onMessage: (response: any) => void;
  };

  /**
   * Every command swaps the shared handlers before it sends, so a command sent while another still waits would
   * take that one's reply. They run one at a time, as in `open-cv.ts`.
   */
  private commandQueue = new PQueue({ concurrency: 1 });

  /**
   * Replies carry no request id, so one that comes after its command timed out would be taken by the next
   * command. Before the queue moves on, the connection is dropped and a new one takes its place: the late reply
   * stays with the old one. The old one is not waited for, since a backend that is stuck does not answer the close
   * either.
   */
  private enqueue = <T>(
    executor: (resolve: (value: T) => void, reject: (reason?: unknown) => void) => void,
    timeout = COMMAND_TIMEOUT_MS,
  ): Promise<T> =>
    this.commandQueue.add(async () => {
      let timer: NodeJS.Timeout | undefined;

      try {
        return await Promise.race([
          new Promise<T>(executor),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              this.ws.close(false);
              this.ws = this.connect();
              reject(new Error(`camera-calibration command timed out after ${timeout} ms`));
            }, timeout);
          }),
        ]);
      } finally {
        clearTimeout(timer);
      }
    }) as Promise<T>;

  constructor() {
    this.events = {
      onError: () => {},
      onFatal: () => {},
      onMessage: () => {},
    };

    this.ws = this.connect();
  }

  /** a connection that was replaced has no say any more, whatever it still reports while it closes */
  private connect = () => {
    const ws = Websocket({
      method: 'camera-calibration',
      onError: (response) => {
        if (ws === this.ws) this.events.onError(response);
      },
      onFatal: (response) => {
        if (ws === this.ws) this.events.onFatal(response);
      },
      onMessage: (data) => {
        if (ws === this.ws) this.events.onMessage(data);
      },
    });

    return ws;
  };

  upload(data: ArrayBuffer | Blob): Promise<any> {
    return this.enqueue((resolve, reject) => {
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
    return this.enqueue((resolve, reject) => {
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
    return this.enqueue((resolve, reject) => {
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
    return this.enqueue((resolve, reject) => {
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
    }, LONG_COMMAND_TIMEOUT_MS);
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
    return this.enqueue((resolve, reject) => {
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
    this.enqueue((resolve, reject) => {
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
    data: { rms?: number; rvec: number[][]; tvec: number[][] };
    success: boolean;
  }> =>
    this.enqueue((resolve, reject) => {
      let success = true;
      let data = {} as { rms?: number; rvec: number[][]; tvec: number[][] };

      this.events.onMessage = (response) => {
        if (response.status === 'fail') {
          success = false;
          console.log('fail', response);
          resolve({ data, success });
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

  /**
   * Find the engraved calibration marks in one raw photo. Needs k / d loaded (`updateData`).
   * `UNSUPPORTED`: the backend predates the command; callers fall back to the manual steps. This is the only
   * place that tells: fluxghost sends the same reply when a handler raises ValueError, which this command's
   * handler cannot, while `autoPnPMatch` can.
   */
  autoPnPDetect = (
    img: ArrayBuffer | Blob,
  ): Promise<{ blobs: AutoPnPBlob[]; success: true; weak: AutoPnPBlob[] } | { reason: string; success: false }> =>
    this.enqueue((resolve, reject) => {
      this.events.onMessage = (response) => {
        if (response.status === 'continue') {
          this.ws.send(img);
        } else if (response.status === 'ok') {
          resolve({ blobs: response.blobs, success: true, weak: response.weak ?? [] });
        } else if (response.status === 'fail') {
          resolve({ reason: response.info ?? response.reason, success: false });
        } else if (isUnknownCommand(response)) {
          resolve({ reason: 'UNSUPPORTED', success: false });
        }
      };
      this.events.onError = (response) => reject(response);
      this.events.onFatal = (response) => reject(response);

      const size = img instanceof Blob ? img.size : img.byteLength;

      this.ws.send(`auto_pnp_detect ${size}`);
    });

  /**
   * Tell which blob is which mark. `blobs` and `weak` are one `autoPnPDetect` result per exposure;
   * `points` comes back ordered like `refPoints` and feeds `solvePnPCalculate`. `filled` counts the
   * marks that were only found among the weak candidates, next to their predicted position.
   * `rMax` (mm) replaces the backend's residual limit for `HIGH_RESIDUAL`.
   */
  autoPnPMatch = (
    refPoints: Array<[number, number]>,
    blobs: AutoPnPBlob[][],
    weak: AutoPnPBlob[][] = [],
    rMax?: number,
  ): Promise<
    | { filled: number; matched: number; points: Array<[number, number]>; rms: number; success: true }
    | {
        filled?: number;
        matched?: number;
        /** null for a mark that was not found; complete after HIGH_RESIDUAL */
        points?: Array<[number, number] | null>;
        /** where each mark should be according to the ones found; null with fewer than 4 found, absent before 2.5.9 */
        predicted?: Array<[number, number]> | null;
        reason: AutoPnPFailReason;
        rms?: null | number;
        success: false;
      }
  > =>
    this.enqueue((resolve, reject) => {
      this.events.onMessage = ({ status, ...rest }) => {
        if (status === 'ok') resolve({ ...rest, success: true });
        else if (status === 'fail') resolve({ ...rest, success: false });
        else if (isUnknownCommand({ status })) reject(rest);
      };
      this.events.onError = (response) => reject(response);
      this.events.onFatal = (response) => reject(response);
      this.ws.send(`auto_pnp_match ${JSON.stringify({ blobs, r_max: rMax, ref_points: refPoints, weak })}`);
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
    this.enqueue((resolve, reject) => {
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
    return this.enqueue((resolve, reject) => {
      this.events.onMessage = (response) => {
        if (response instanceof Blob) {
          resolve({ blob: response });
        } else if (response.status === 'continue') {
          this.ws.send(img);
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

      const size = img instanceof Blob ? img.size : img.byteLength;
      const args = JSON.stringify({ params, size });

      this.ws.send(`remap_image ${args}`);
    });
  };

  updateData = (data: FisheyeCaliParameters): Promise<boolean> =>
    this.enqueue((resolve, reject) => {
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
    this.enqueue((resolve, reject) => {
      let success = true;
      let data = {} as { rvec_polyfit: number[][]; tvec_polyfit: number[][] };

      this.events.onMessage = (response) => {
        if (response.status === 'fail') {
          success = false;
          console.log('fail', response);
          resolve({ data, success });
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
    opts: { is_vertical?: boolean } = {},
  ): Promise<
    { imgp: number[][]; objp: number[][]; ratio: number; success: true } | { reason: string; success: false }
  > =>
    this.enqueue((resolve, reject) => {
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

      // detect_charuco [file_length] [squareX] [squareY] [opts]
      this.ws.send(['detect_charuco', size, squareX, squareY, JSON.stringify(opts)].join(' '));
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
    this.enqueue((resolve, reject) => {
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
    }, LONG_COMMAND_TIMEOUT_MS);
}

export const cameraCalibrationApi = new CameraCalibrationApi();

export default CameraCalibrationApi;
