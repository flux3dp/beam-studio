/**
 * API svg laser parser
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-svg-laser-parser
 */
import { match } from 'ts-pattern';

import Alert from '@core/app/actions/alert-caller';
import constant, { dpmm, modelsWithModules } from '@core/app/actions/beambox/constant';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import presprayArea from '@core/app/actions/canvas/prespray-area';
import Progress from '@core/app/actions/progress-caller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import AlertConstants from '@core/app/constants/alert-constants';
import { DetectedLayerModule, LayerModule, type LayerModuleType } from '@core/app/constants/layer-module/layer-modules';
import { type EngraveDpiOption, getEngraveDpmm } from '@core/app/constants/resolutions';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import workareaManager, { ExpansionType } from '@core/app/svgedit/workarea';
import { getAutoFeeder, getPassThrough } from '@core/helpers/addOn';
import { getRotaryInfo } from '@core/helpers/addOn/rotary';
import AlertConfig from '@core/helpers/api/alert-config';
import { getAllOffsets } from '@core/helpers/device/moduleOffsets';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import isDev from '@core/helpers/is-dev';
import getJobOrigin, { getRefModule } from '@core/helpers/job-origin';
import { hasModuleLayer } from '@core/helpers/layer-module/layer-module-helper';
import round from '@core/helpers/math/round';
import { regulateEngraveDpiOption } from '@core/helpers/regulateEngraveDpi';
import Websocket from '@core/helpers/websocket';
import fileSystem from '@core/implementations/fileSystem';
import fs from '@core/implementations/fileSystem';
import storage from '@core/implementations/storage';
import type { BackendProgressData, TaskMetaData } from '@core/interfaces/ITask';
import type { IBaseConfig, IFcodeConfig, TAccelerationOverride } from '@core/interfaces/ITaskConfig';
import type { IWrappedTaskFile } from '@core/interfaces/IWrappedFile';

export const getExportOpt = async (
  opt: IBaseConfig,
  args?: string[],
): Promise<{
  // without args, return config
  config?: IFcodeConfig;
  curveEngravingData?: string;
  // with args, push data to original args array and return other data
  loopCompensation?: number;
}> => {
  const { device, model, supportAccOverrideV1, supportJobOrigin = true, supportPwm = true } = opt;
  const config: IFcodeConfig = {
    hardware_name: 'beambox',
    model,
  };
  const documentState = useDocumentStore.getState();
  const globalPreference = useGlobalPreferenceStore.getState();

  const isDevMode = isDev();
  const paddingAccel = globalPreference['padding_accel'];
  const useDevPaddingAcc = isDevMode && paddingAccel;
  const workareaObj = getWorkarea(model);

  if (model === 'fhexa1') {
    config.hardware_name = 'hexa';

    if (!useDevPaddingAcc) config.acc = 7500;
  } else if (model === 'fbb1p') {
    config.hardware_name = 'pro';
  } else if (model === 'fbb1b') {
    config.hardware_name = 'beambox';
  } else if (model === 'fbm1') {
    config.hardware_name = 'beamo';
  } else if (model === 'ado1') {
    config.hardware_name = 'ado1';

    if (!useDevPaddingAcc) config.acc = opt.paddingAccel || 3200;
  } else if (model === 'fbb2') {
    config.hardware_name = 'fbb2';

    if (!useDevPaddingAcc) config.acc = 8000;
  } else if (model === 'fbm2') {
    config.hardware_name = 'fbm2';

    if (!useDevPaddingAcc) config.acc = 8000;
  } else {
    config.hardware_name = model;
  }

  if (model === 'fhx2rf') {
    config.watt = useCanvasStore.getState().watt;
  }

  if (useDevPaddingAcc) config.acc = paddingAccel;

  if (opt.codeType === 'gcode') config.gc = true;

  if (globalPreference['reverse-engraving']) config.rev = true;

  const addOnInfo = getAddOnInfo(model);
  const hasJobOrigin = documentState['enable-job-origin'] && addOnInfo.jobOrigin && supportJobOrigin;

  if (hasJobOrigin) {
    // firmware version / model check
    const { x, y } = await getJobOrigin();

    config.job_origin = [Math.round(x * 10 ** 3) / 10 ** 3, Math.round(y * 10 ** 3) / 10 ** 3];
  }

  const rotaryInfo = getRotaryInfo(model, {
    forceY: config.job_origin ? config.job_origin[1] * constant.dpmm : undefined,
  });
  const rotaryMode = Boolean(rotaryInfo);
  const autoFeeder = getAutoFeeder(addOnInfo);

  if (rotaryInfo) {
    config.spin = rotaryInfo.y;
    config.rotary_split = rotaryInfo.ySplit;
    config.rotary_overlap = rotaryInfo.yOverlap;

    const rotaryRatio = rotaryInfo.yRatio;

    if (rotaryRatio !== 1) {
      config.rotary_y_ratio = rotaryRatio;
    }
  } else if (autoFeeder) {
    config.rotary_y_ratio = addOnInfo.autoFeeder!.rotaryRatio;
    config.rotary_y_ratio *= documentState['auto-feeder-scale'];
    config.rotary_z_motion = false;

    if (config.job_origin) {
      config.spin = config.job_origin[1] * constant.dpmm;
    } else {
      config.spin = config.rev ? workareaObj.pxHeight : (addOnInfo.autoFeeder!.minY ?? 0);
    }
  }

  const updateAccOverride = (value: TAccelerationOverride) => {
    if (!config.acc_override) config.acc_override = value;

    const keys = Object.keys(value) as Array<keyof typeof value>;

    for (let i = 0; i < keys.length; i += 1) {
      config.acc_override[keys[i]] = { ...config.acc_override[keys[i]], ...value[keys[i]] };
    }
  };

  if (workareaObj.accOverride) updateAccOverride(workareaObj.accOverride);

  if (modelsWithModules.has(model)) {
    const { h, w, x, y } = presprayArea.getPosition(true);
    const workareaWidth = workareaObj.width;
    const minY = workareaManager.minY / dpmm;

    if (model === 'fbm2' && hasModuleLayer([LayerModule.PRINTER_4C], { checkRepeat: true, checkVisible: true })) {
      if (documentState['skip_prespray']) {
        config.skip_prespray = true;
      }

      if (device?.model === 'fbm2') {
        try {
          await deviceMaster.select(device);

          const res = await deviceMaster.getDeviceSetting('machine_limit_position');

          // removing spaces by JSON.parse and stringify
          if (res.value) config.machine_limit_position = JSON.stringify(JSON.parse(res.value));
        } catch (error) {
          console.error('Failed to get machine_limit_position', error);
        }
      }

      if (documentState['enable-4c-prespray-area']) {
        config.prespray = [x, y - minY, w, h];
      }
    } else if (model === 'ado1') {
      config.prespray = rotaryMode && !hasJobOrigin ? [workareaWidth - 12, 45, 12, h] : [x, y - minY, w, h];
    }

    if (!isDevMode || globalPreference['multipass-compensation']) {
      config.mpc = true;
    }

    if (!isDevMode || globalPreference['one-way-printing']) {
      config.owp = true;
    }

    if (addOnInfo.multiModules) {
      if (documentState['enable-4c'] && documentState['enable-1064']) {
        config.expected_module = DetectedLayerModule.PRINTER_4C_WITH_1064;
        config.mep = config.mpp = 25;
        config.acc = 2000;
        updateAccOverride({ fill: { x: 2000, y: 2000 } });
      } else if (documentState['enable-4c']) {
        config.expected_module = DetectedLayerModule.PRINTER_4C;
        config.mep = config.mpp = 20;
        config.acc = 2000;
        updateAccOverride({ fill: { x: 2000, y: 2000 } });
      } else if (documentState['enable-1064']) {
        config.expected_module = DetectedLayerModule.LASER_1064;
        config.mep = config.mpp = 25;
        config.acc = 2000;
        updateAccOverride({ fill: { x: 2000, y: 2000 } });
      } else {
        config.expected_module = DetectedLayerModule.NONE;
      }
    }
  }

  if (opt.enableAutoFocus && addOnInfo.autoFocus) {
    config.af = true;

    if (globalPreference['af-offset']) {
      config.z_offset = globalPreference['af-offset'];
    }
  }

  if (opt.enableDiode) {
    config.diode = [globalPreference['diode_offset_x'], globalPreference['diode_offset_y']];

    if (globalPreference['diode-one-way-engraving']) {
      config.diode_owe = true;
    }
  }

  const isBorderLess = documentState.borderless && addOnInfo.openBottom;

  if (isBorderLess) {
    config.mask = [0, constant.borderless.safeDistance.X, 0, 0]; // top right bottom left
  }

  if (opt.shouldUseFastGradient) {
    config.fg = true;
  }

  if (opt.shouldMockFastGradient) {
    config.mfg = true;
  }

  if (curveEngravingModeController.hasArea() && addOnInfo.curveEngraving) {
    const { bbox, gap, highest, lowest, objectHeight, points: rawPoints } = curveEngravingModeController.data!;
    const points: Array<[number, number, number]> =
      curveEngravingModeController.subdividedPoints ??
      (rawPoints
        .flat()
        .map((p) => [p[0] + (p[3] ?? 0), p[1] + (p[4] ?? 0), p[2]])
        .filter((p) => p[2] !== null) as Array<[number, number, number]>);

    // if lowest is null, it means no points is measured successfully
    if (lowest !== null && highest !== null) {
      const data = {
        bbox,
        gap,
        points,
        safe_height: Math.max(Math.min(highest, lowest - objectHeight), 0),
      };

      config.curve_engraving = data;
    }
  }

  if (config.curve_engraving && workareaObj.curveSpeedLimit?.x) {
    config.csl = workareaObj.curveSpeedLimit.x * 60;
  }

  if (globalPreference['vector_speed_constraint']) {
    const vectorSpeedLimit = (autoFeeder && addOnInfo.autoFeeder?.vectorSpeedLimit) || workareaObj.vectorSpeedLimit;

    if (vectorSpeedLimit) {
      config.vsc = true; // not used by new backend, keep for web version compatibility
      config.vsl = vectorSpeedLimit * 60; // convert to mm/min
    }
  }

  if (!supportPwm) {
    config.no_pwm = true;
  }

  // default min_speed is 3 if not set
  config.min_speed = workareaObj.minSpeed;

  if (isDevMode && globalPreference['enable-custom-backlash']) config.cbl = true;

  let printingTopPadding: number | undefined = undefined;
  let printingBotPadding: number | undefined = undefined;

  if (rotaryMode && constant.adorModels.includes(model)) {
    printingTopPadding = 43;
    printingBotPadding = 43;
  }

  if (model === 'fbm2') {
    printingTopPadding = 10;
    printingBotPadding = 10;
  }

  const isPassThroughTask =
    document.querySelectorAll('#svgcontent > g.layer:not([display="none"]) [data-pass-through="1"]').length > 0 ||
    getPassThrough(addOnInfo);

  if (model === 'fbb2' && (isPassThroughTask || autoFeeder)) {
    config.mep = 30;
    updateAccOverride({ fill: { x: 5000, y: 2000 }, path: { x: 500, y: 500 } });
  }

  if (autoFeeder) {
    if (constant.fcodeV2Models.has(model)) {
      updateAccOverride({ fill: { a: 100 }, path: { a: 100 } });
    } else if (model === 'fbm1' && supportAccOverrideV1) {
      updateAccOverride({ fill: { y: 100 }, path: { y: 100 } });
    }
  }

  if (isDevMode) {
    let storageValue = localStorage.getItem('min_engraving_padding');

    if (storageValue) config.mep = Number(storageValue);

    storageValue = localStorage.getItem('min_printing_padding');

    if (storageValue) config.mpp = Number(storageValue);

    storageValue = localStorage.getItem('printing_top_padding');

    if (storageValue && !Number.isNaN(Number(storageValue))) printingTopPadding = Number(storageValue);

    storageValue = localStorage.getItem('printing_bot_padding');

    if (storageValue && !Number.isNaN(Number(storageValue))) printingBotPadding = Number(storageValue);

    storageValue = localStorage.getItem('printing_slice_width');

    if (storageValue && !Number.isNaN(Number(storageValue))) {
      config.psw = Number(storageValue);
    }

    storageValue = localStorage.getItem('printing_slice_height');

    if (storageValue && !Number.isNaN(Number(storageValue))) {
      config.psh = Number(storageValue);
    }

    storageValue = localStorage.getItem('nozzle_voltage');

    if (storageValue) config.nv = Number(storageValue);

    storageValue = localStorage.getItem('nozzle_pulse_width');

    if (storageValue) config.npw = Number(storageValue);

    storageValue = localStorage.getItem('travel_speed');

    if (storageValue && !Number.isNaN(Number(storageValue))) config.ts = Number(storageValue);

    storageValue = localStorage.getItem('path_travel_speed');

    if (storageValue && !Number.isNaN(Number(storageValue))) config.pts = Number(storageValue);

    storageValue = localStorage.getItem('a_travel_speed');

    if (storageValue && !Number.isNaN(Number(storageValue))) config.ats = Number(storageValue);
  }

  if (printingTopPadding !== undefined) config.ptp = printingTopPadding;

  if (printingBotPadding !== undefined) config.pbp = printingBotPadding;

  if (modelsWithModules.has(model)) {
    const offsets = structuredClone(await getAllOffsets(model, { useCache: false }));
    const keys = Object.keys(offsets) as unknown as LayerModuleType[];
    const { minY } = workareaManager;
    let offsetX = 0;
    let offsetY = minY / dpmm;

    if (hasJobOrigin) {
      const refModule = getRefModule();

      if (offsets[refModule]) {
        const [refX, refY] = offsets[refModule];

        offsetX += refX;
        offsetY += refY;
      }
    }

    keys.forEach((key) => {
      // Always reassign offsets to remove optional boolean values
      offsets[key] = [round(offsets[key]![0] - offsetX, 2), round(offsets[key]![1] - offsetY, 2)];
    });

    // Set base module if not included in getAllOffsets
    if (!offsets[LayerModule.LASER_UNIVERSAL]) {
      offsets[LayerModule.LASER_UNIVERSAL] = [round(0 - offsetX, 2), round(0 - offsetY, 2)];
    }

    config.mof = offsets as Record<LayerModuleType, [number, number]>;
  }

  const loopCompensation = Number(storage.get('loop_compensation') || '0');

  if (loopCompensation >= 0) {
    config.loop_compensation = loopCompensation;
  }

  if (rotaryMode || autoFeeder || !globalPreference['segmented-engraving']) {
    config.segment = false;
  }

  if (documentState.auto_shrink) {
    let value = workareaObj.autoShrink;

    if (isDevMode) {
      const storageValue = localStorage.getItem('auto_shrink');

      if (storageValue) value = Number(storageValue);
    }

    if (value && value > 0) config.engraving_erode = value;
  }

  if (args) {
    (Object.keys(config) as Array<keyof IFcodeConfig>).forEach((key) => {
      if (['curve_engraving', 'loop_compensation', 'z_offset'].includes(key)) {
        // Skip special keys
      } else if (key === 'hardware_name') {
        // hardware_name is deprecated, replaced with model, keep now for web version ghost
        // may be removed in the future
        args.push(`-${config[key]}`);
      } else if (key === 'af' && config.z_offset) {
        // Handle optional -af value
        args.push('-af', config.z_offset.toString());
      } else {
        const keyArg = `-${key.replaceAll('_', '-')}`;

        if (config[key] === true) {
          args.push(keyArg);
        } else if (config[key] === false) {
          args.push(keyArg, 'false');
        } else if (typeof config[key] === 'number') {
          args.push(keyArg, config[key].toString());
        } else if (Array.isArray(config[key])) {
          args.push(keyArg, config[key].join());
        } else if (typeof config[key] === 'object') {
          args.push(keyArg, JSON.stringify(config[key]));
        } else if (typeof config[key] === 'string') {
          args.push(keyArg, config[key]);
        }
      }
    });

    let curveEngravingData: string | undefined;

    if (config.curve_engraving) {
      curveEngravingData = JSON.stringify(config.curve_engraving, (key, val) => {
        if (typeof val === 'number') {
          return Math.round(val * 1e3) / 1e3;
        }

        return val;
      });
    }

    return { curveEngravingData, loopCompensation: config.loop_compensation };
  }

  return { config };
};

export default (parserOpts: { onFatal?: (data) => void; type?: string }) => {
  parserOpts = parserOpts || {};

  const apiMethod = {
    svgeditor: 'svgeditor-laser-parser',
  }[parserOpts.type || 'svgeditor'];
  const events: { onError: (data?) => void; onMessage: (data?) => void } = {
    onError: () => {},
    onMessage: () => {},
  };
  const ws = Websocket({
    method: apiMethod,
    onError: (data) => events.onError(data),

    onFatal: (data) => {
      if (parserOpts.onFatal) {
        parserOpts.onFatal(data);
      } else {
        events.onError(data);
      }
    },
    onMessage: (data) => events.onMessage(data),
  });
  const resetWebsocket = () => {
    ws.close(true);
    events.onMessage = () => {};
    events.onError = () => {};
  };

  const setParameter = (key: string, value: number | string) =>
    new Promise<null>((resolve, reject) => {
      events.onMessage = (data) => {
        console.log(data);

        if (data.status === 'ok') {
          resolve(null);
        } else if (data.status === 'error') {
          console.error('Failed to set parameter', key, value, data);
          resolve(null);
        }
      };
      events.onError = (data) => {
        reject(data);
      };
      ws.send(['set_params', key, value].join(' '));
    });

  return {
    divideSVG({ byLayer = false, scale, timeout }: { byLayer?: boolean; scale?: number; timeout?: number } = {}) {
      return new Promise<
        { data: Record<string, Blob> & { bitmapOffset?: [number, number] }; res: true } | { data: string; res: false }
      >((resolve) => {
        const args = [byLayer ? 'divide_svg_by_layer' : 'divide_svg'];
        const finalBlobs: Record<string, Blob> & { bitmapOffset?: [number, number] } = {};
        let blobs: Blob[] = [];
        let currentLength = 0;
        let currentName = '';

        if (scale) {
          args.push('-s');
          args.push(String(Math.floor(scale * 100) / 100));
        }

        events.onMessage = (data) => {
          if (data.name) {
            currentName = data.name;
            currentLength = data.length;

            if (currentName === 'bitmap') {
              finalBlobs.bitmapOffset = data.offset;
            }
          } else if (data instanceof Blob) {
            blobs.push(data);

            const blob = new Blob(blobs);

            if (currentLength === blob.size) {
              blobs = [];
              finalBlobs[currentName] = blob;
            }
          } else if (data.status === 'ok') {
            resolve({ data: finalBlobs, res: true });
          } else if (data.status === 'Error') {
            Progress.popById('loading_image');
            resolve({ data: data.message, res: false });
          }
        };

        ws.send(args.join(' '));

        if (timeout && timeout > 0) {
          setTimeout(() => {
            resolve({ data: 'timeout', res: false });
          }, timeout);
        }
      });
    },
    gcodeToFcode(taskData: { arrayBuffer: ArrayBuffer; size: number; thumbnailSize: number }, opts) {
      const $deferred = $.Deferred();
      const warningCollection = [];
      const args = ['g2f'];
      const blobs: Blob[] = [];
      let duration: number;
      let totalLength = 0;
      let blob;

      events.onMessage = (data) => {
        if (data instanceof Blob === true) {
          blobs.push(data);
          blob = new Blob(blobs);

          if (totalLength === blob.size) {
            opts.onFinished(blob, args[2], duration);
          }
        } else {
          switch (data.status) {
            case 'continue':
              ws.send(taskData.arrayBuffer);
              break;
            case 'ok':
              $deferred.resolve('ok');
              break;
            case 'warning':
              warningCollection.push(data.message);
              break;
            case 'computing':
              opts.onProgressing(data);
              break;
            case 'complete':
              totalLength = data.length;
              duration = Math.floor(data.time) + 1;
              break;
            case 'Error':
              opts.onError(data.message);
              break;
            default:
              break;
          }
        }
      };
      events.onError = (data) => {
        console.error(data);
      };

      ws.send(['g2f', taskData.size, taskData.thumbnailSize].join(' '));

      return $deferred.promise();
    },
    async getTaskCode(
      names: string[],
      opts: IBaseConfig & {
        fileMode?: string;
        forceArgString?: string;
        onError?: (message: string) => void;
        onFinished: (blob: Blob, duration: number, metadata: TaskMetaData) => void;
        onProgressing?: (data: BackendProgressData) => void;
      },
    ) {
      opts = opts || {};

      const args = ['go', names.join(' '), opts.fileMode || '-f'];
      const blobs: Blob[] = [];
      let duration: number;
      let totalLength = 0;
      let blob;
      let metadata: TaskMetaData;

      if (!opts.forceArgString) {
        const { curveEngravingData, loopCompensation } = await getExportOpt(opts, args);

        if (loopCompensation !== undefined && loopCompensation >= 0) {
          await setParameter('loop_compensation', loopCompensation);
        }

        if (curveEngravingData) {
          await setParameter('curve_engraving', curveEngravingData);
        }
      }

      events.onMessage = (data) => {
        if (data.status === 'computing') {
          opts.onProgressing?.(data);
        } else if (data.status === 'complete') {
          totalLength = data.length;
          duration = Math.floor(data.time) + 1;
          metadata = data.metadata;
        } else if (data instanceof Blob === true) {
          blobs.push(data);
          blob = new Blob(blobs);

          if (totalLength === blob.size) {
            opts.onFinished(blob, duration, metadata);
          }
        } else if (data.status === 'Error') {
          opts.onError?.(data.message);
        }
      };
      ws.send(opts.forceArgString ?? args.join(' '));
    },
    interruptCalculation: () => {
      ws.send('interrupt');
      events.onMessage = (data) => {
        switch (data.status) {
          case 'ok':
            console.log('calculation interrupted');
            resetWebsocket();
            break;
          default:
            console.warn('Unknown Status:', data.status);
            break;
        }
      };
    },
    resetWebsocket,

    uploadPlainSVG(file: Blob) {
      const $deferred = $.Deferred();
      const warningCollection = [];

      events.onMessage = (data) => {
        switch (data.status) {
          case 'continue':
            ws.send(file);
            break;
          case 'ok':
            $deferred.resolve('ok');
            break;
          case 'warning':
            warningCollection.push(data.message);
            break;
          default:
            break;
        }
      };
      events.onError = (data) => {
        console.error(data);
      };

      const getBasename = (p?: string) => {
        if (!p) return '';

        return p.match(/(.+)[/\\].+/)?.[1] || '';
      };
      const reader = new FileReader();

      reader.onloadend = (e) => {
        let svgString = e.target?.result as string;
        const matchImages = svgString.match(/<image[^>]+>/g);
        let allImageValid = true;
        let hasPath = false;

        if (matchImages) {
          const path = fileSystem.getPathForFile(file as File);
          const basename = getBasename(path);

          for (let i = 0; i < matchImages.length; i += 1) {
            const hrefMatch = matchImages[i].match(/xlink:href="[^"]+"/);

            if (!hrefMatch) {
              continue;
            }

            const hrefRaw = hrefMatch[0];
            const hrefCleaned = hrefRaw.substring(12, hrefRaw.length - 1);

            if (hrefCleaned.startsWith('data:')) {
              continue;
            }

            let newPath = hrefCleaned
              .replace(/&apos;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&gt;/g, '>')
              .replace(/&lt;/g, '<')
              .replace(/&amp;/g, '&');

            // Test Absolute Path
            hasPath = true;

            if (fs.exists(newPath)) {
              continue;
            }

            // Test Relative Path
            if (path) {
              newPath = fs.join(basename, newPath);

              if (fs.exists(newPath)) {
                newPath = newPath
                  .replace(/&/g, '&amp;')
                  .replace(/'/g, '&apos;')
                  .replace(/"/g, '&quot;')
                  .replace(/>/g, '&gt;')
                  .replace(/</g, '&lt;');
                svgString = svgString.replace(`xlink:href="${hrefCleaned}"`, `xlink:href="${newPath}"`);
                continue;
              }
            }

            allImageValid = false;
            $deferred.resolve('invalid_path');
          }
        }

        if (allImageValid && hasPath && !AlertConfig.read('skip_image_path_warning')) {
          Alert.popUp({
            checkbox: {
              callbacks: () => AlertConfig.write('skip_image_path_warning', true),
              text: i18n.lang.alert.dont_show_again,
            },
            message: i18n.lang.beambox.popup.svg_image_path_waring,
            type: AlertConstants.SHOW_POPUP_WARNING,
          });
        }

        if (allImageValid) {
          file = new Blob([svgString], {
            type: 'text/plain',
          });

          ws.send(['upload_plain_svg', 'plain-svg', file.size].join(' '));
        }
      };
      reader.readAsText(file);

      return $deferred.promise();
    },

    uploadPlainTextSVG(textElement: Element, bbox) {
      const $deferred = $.Deferred();
      const warningCollection = [];

      events.onError = (data) => {
        console.error(data);
      };

      let textString = textElement.outerHTML;

      if (textElement.getAttribute('data-verti') === 'true') {
        textString = textString.replace(/letter-spacing="[^"]+"/, '');
      }

      let defs = '';

      for (let i = 0; i < textElement.childNodes.length; i += 1) {
        const childNode = textElement.childNodes[i] as Element;

        if (childNode.nodeName === 'textPath') {
          const href = childNode.getAttribute('href');
          const hrefElem = href ? document.querySelector(href) : null;

          if (hrefElem) {
            defs += hrefElem.outerHTML;
          }
        }
      }

      const { height, width, x, y } = bbox;
      const svgString = `<svg viewBox="${x} ${y} ${width} ${height}"><defs>${defs}</defs>${textString}</svg>`;

      console.log(svgString);

      const file = new Blob([svgString], {
        type: 'text/plain',
      });

      events.onMessage = (data) => {
        switch (data.status) {
          case 'continue':
            ws.send(file);
            break;
          case 'ok':
            $deferred.resolve('ok');
            break;
          case 'warning':
            warningCollection.push(data.message);
            break;
          default:
            break;
        }
      };
      ws.send(['upload_plain_svg', 'text-svg', file.size].join(' '));

      return $deferred.promise();
    },
    uploadToSvgeditorAPI(
      file: IWrappedTaskFile,
      {
        engraveDpi = 'medium',
        forceArgString,
        model,
        onProgressing,
      }: {
        engraveDpi?: EngraveDpiOption;
        forceArgString?: string;
        model: WorkAreaModel;
        onProgressing?: (data: BackendProgressData) => void;
      },
    ) {
      return new Promise<{ message?: string; res: boolean }>((resolve) => {
        const orderName = 'svgeditor_upload';

        const sendFile = () => {
          const warningCollection: string[] = [];
          const CHUNK_SIZE = 128 * 1024; // 128KB
          const chunkCounts = Math.ceil(file.size / CHUNK_SIZE);

          events.onMessage = (data) => {
            switch (data.status) {
              case 'computing':
                onProgressing?.(data);
                break;
              case 'continue':
                for (let i = 0; i < chunkCounts; i += 1) {
                  const start = i * CHUNK_SIZE;
                  const end = Math.min(file.size, start + CHUNK_SIZE);
                  const chunk = file.data.slice(start, end);

                  ws.send(chunk);
                }
                break;
              case 'ok':
                resolve({ res: true });
                break;
              case 'warning':
                warningCollection.push(data.message);
                break;
              case 'Error':
                resolve({ message: `${data.message}\nWarning: ${warningCollection.join('\n')}`, res: false });
                break;
              default:
                console.warn('Unknown Status:', data.status);
            }
          };

          events.onError = (data) => {
            const errorMessages = `${data.message || data.symbol?.join('_') || String(data) || 'Unknown Error'}\nWarnings: ${warningCollection.join('\n')}`;

            resolve({ message: errorMessages, res: false });
          };

          if (forceArgString) {
            ws.send(forceArgString);

            return;
          }

          const args = [orderName, file.uploadName, file.size, file.thumbnailSize];

          const { expansion, expansionType, height, width } = workareaManager;

          if (expansion.some((val) => val > 0) && expansionType !== ExpansionType.PASS_THROUGH) {
            args.push('-workarea');
            args.push(JSON.stringify([width / constant.dpmm, height / constant.dpmm]));
          }

          // deprecated, replaced with model, keep now for web version ghost
          // may be removed in the future
          if (model === 'fhexa1') {
            args.push('-hexa');
          } else if (model === 'fbb1p') {
            args.push('-pro');
          } else if (model === 'fbm1') {
            args.push('-beamo');
          } else {
            args.push(`-${model}`);
          }

          args.push('-model', model);

          const regulatedDpi = regulateEngraveDpiOption(model, engraveDpi);

          // old dpi flags, can be removed after firmware ghost support new -dpmm flag
          match(regulatedDpi)
            .with('low', () => args.push('-ldpi'))
            .with('medium', () => args.push('-mdpi'))
            .with('high', () => args.push('-hdpi'))
            // set ultra to old udpi for backward compatibility
            .with('detailed', 'ultra', () => args.push('-udpi'))
            .otherwise(() => {});

          const dpmm = getEngraveDpmm(regulatedDpi, model);

          args.push(`-dpmm ${dpmm}`);

          ws.send(args.join(' '));
        };

        sendFile();
      });
    },
  };
};
