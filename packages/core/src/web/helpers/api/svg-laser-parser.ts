/* eslint-disable no-continue */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/**
 * API svg laser parser
 * Ref: https://github.com/flux3dp/fluxghost/wiki/websocket-svg-laser-parser
 */
import Alert from 'app/actions/alert-caller';
import AlertConfig from 'helpers/api/alert-config';
import AlertConstants from 'app/constants/alert-constants';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import constant from 'app/actions/beambox/constant';
import curveEngravingModeController from 'app/actions/canvas/curveEngravingModeController';
import fs from 'implementations/fileSystem';
import getRotaryRatio from 'helpers/device/get-rotary-ratio';
import i18n from 'helpers/i18n';
import isDev from 'helpers/is-dev';
import getJobOrigin, { getRefModule } from 'helpers/job-origin';
import moduleOffsets from 'app/constants/layer-module/module-offsets';
import Progress from 'app/actions/progress-caller';
import presprayArea from 'app/actions/canvas/prespray-area';
import storage from 'implementations/storage';
import Websocket from 'helpers/websocket';
import rotaryAxis from 'app/actions/canvas/rotary-axis';
import { getSupportInfo } from 'app/constants/add-on';
import { getWorkarea } from 'app/constants/workarea-constants';
import { IBaseConfig, IFcodeConfig } from 'interfaces/ITaskConfig';
import { modelsWithModules } from 'app/constants/layer-module/layer-modules';

export const getExportOpt = (
  opt: IBaseConfig,
  args?: string[]
): {
  // without args, return config
  config?: IFcodeConfig;
  // with args, push data to original args array and return other data
  loopCompensation?: number;
  curveEngravingData?: string;
} => {
  const { model, supportJobOrigin = true, supportPwm = true } = opt;
  const config: IFcodeConfig = {
    model,
    hardware_name: 'beambox',
  };

  const isDevMode = isDev();
  const paddingAccel = BeamboxPreference.read('padding_accel');
  const useDevPaddingAcc = isDevMode && paddingAccel;
  const workareaObj = getWorkarea(model);
  if (model === 'fhexa1') {
    config.hardware_name = 'hexa';
    if (!useDevPaddingAcc) config.acc = 7500;
  } else if (model === 'fbb1p') config.hardware_name = 'pro';
  else if (model === 'fbb1b') config.hardware_name = 'beambox';
  else if (model === 'fbm1') config.hardware_name = 'beamo';
  else if (model === 'ado1') {
    config.hardware_name = 'ado1';
    if (!useDevPaddingAcc) config.acc = opt.paddingAccel || 3200;
  } else if (model === 'fbb2') {
    config.hardware_name = 'fbb2';
    if (!useDevPaddingAcc) config.acc = 8000;
  } else config.hardware_name = model;

  if (useDevPaddingAcc) config.acc = paddingAccel;

  if (opt.codeType === 'gcode') config.gc = true;

  const supportInfo = getSupportInfo(model);
  const rotaryMode = BeamboxPreference.read('rotary_mode');
  if (rotaryMode && supportInfo.rotary) {
    config.spin = rotaryAxis.getPosition();
    const rotaryRatio = getRotaryRatio(supportInfo);
    if (rotaryRatio !== 1) {
      config.rotary_y_ratio = rotaryRatio;
    }
  }

  const hasJobOrigin =
    BeamboxPreference.read('enable-job-origin') && supportInfo.jobOrigin && supportJobOrigin;
  if (hasJobOrigin) {
    // firmware version / model check
    const { x, y } = getJobOrigin();
    config.job_origin = [Math.round(x * 10 ** 3) / 10 ** 3, Math.round(y * 10 ** 3) / 10 ** 3];
  }

  if (constant.adorModels.includes(model)) {
    const { x, y, w, h } = presprayArea.getPosition(true);
    const workareaWidth = workareaObj.width;

    config.prespray = rotaryMode && !hasJobOrigin ? [workareaWidth - 12, 45, 12, h] : [x, y, w, h];
    if (!isDevMode || BeamboxPreference.read('multipass-compensation') !== false) config.mpc = true;
    if (!isDevMode || BeamboxPreference.read('one-way-printing') !== false) config.owp = true;
  }

  if (
    i18n.getActiveLang() === 'zh-cn' &&
    BeamboxPreference.read('blade_radius') &&
    BeamboxPreference.read('blade_radius') > 0
  ) {
    config.blade = BeamboxPreference.read('blade_radius');
    if (BeamboxPreference.read('blade_precut')) {
      config.precut = [
        BeamboxPreference.read('precut_x') || 0,
        BeamboxPreference.read('precut_y') || 0,
      ];
    }
  }

  if (opt.enableAutoFocus && supportInfo.autoFocus) {
    config.af = true;
    if (BeamboxPreference.read('af-offset')) config.z_offset = BeamboxPreference.read('af-offset');
  }
  if (opt.enableDiode) {
    config.diode = [
      BeamboxPreference.read('diode_offset_x') || 0,
      BeamboxPreference.read('diode_offset_y') || 0,
    ];
    if (BeamboxPreference.read('diode-one-way-engraving') !== false) {
      config.diode_owe = true;
    }
  }
  const isBorderLess = BeamboxPreference.read('borderless') && supportInfo.openBottom;
  if (BeamboxPreference.read('enable_mask') || isBorderLess) {
    const clipRect: [number, number, number, number] = [0, 0, 0, 0]; // top right bottom left
    if (isBorderLess) clipRect[1] = constant.borderless.safeDistance.X;
    config.mask = clipRect;
  }
  if (opt.shouldUseFastGradient) config.fg = true;
  if (opt.shouldMockFastGradient) config.mfg = true;
  if (opt.vectorSpeedConstraint) {
    if (workareaObj.vectorSpeedLimit) {
      config.vsc = true; // not used by new backend, keep for web version compatibility
      config.vsl = workareaObj.vectorSpeedLimit * 60; // convert to mm/min
    }
  }
  if (!supportPwm) config.no_pwm = true;
  if (workareaObj.minSpeed < 3) config.min_speed = workareaObj.minSpeed;
  else if (BeamboxPreference.read('enable-low-speed')) config.min_speed = 1;
  if (BeamboxPreference.read('reverse-engraving')) config.rev = true;
  if (BeamboxPreference.read('enable-custom-backlash')) config.cbl = true;
  let printingTopPadding: number;
  let printingBotPadding: number;
  if (rotaryMode && constant.adorModels.includes(model)) {
    printingTopPadding = 43;
    printingBotPadding = 43;
  }
  const isPassThroughTask =
    document.querySelectorAll('#svgcontent > g.layer:not([display="none"]) [data-pass-through="1"]')
      .length > 0 || BeamboxPreference.read('pass-through');
  if (isPassThroughTask && model === 'fbb2') {
    config.mep = 50;
  }

  if (isDevMode) {
    let storageValue = localStorage.getItem('min_engraving_padding');
    if (storageValue) {
      config.mep = Number(storageValue);
    }
    storageValue = localStorage.getItem('min_printing_padding');
    if (storageValue) {
      config.mpp = Number(storageValue);
    }
    storageValue = localStorage.getItem('printing_top_padding');
    if (storageValue && !Number.isNaN(Number(storageValue))) {
      printingTopPadding = Number(storageValue);
    }
    storageValue = localStorage.getItem('printing_bot_padding');
    if (storageValue && !Number.isNaN(Number(storageValue))) {
      printingBotPadding = Number(storageValue);
    }
    storageValue = localStorage.getItem('nozzle_votage');
    if (storageValue) {
      config.nv = Number(storageValue);
    }
    storageValue = localStorage.getItem('nozzle_pulse_width');
    if (storageValue) {
      config.npw = Number(storageValue);
    }
    storageValue = localStorage.getItem('travel_speed');
    if (storageValue && !Number.isNaN(Number(storageValue))) {
      config.ts = Number(storageValue);
    }
    storageValue = localStorage.getItem('path_travel_speed');
    if (storageValue && !Number.isNaN(Number(storageValue))) {
      config.pts = Number(storageValue);
    }
    storageValue = localStorage.getItem('a_travel_speed');
    if (storageValue && !Number.isNaN(Number(storageValue))) {
      config.ats = Number(storageValue);
    }
  }
  if (printingTopPadding !== undefined) {
    config.ptp = printingTopPadding;
  }
  if (printingBotPadding !== undefined) {
    config.pbp = printingBotPadding;
  }
  if (modelsWithModules.has(model)) {
    const offsets = { ...moduleOffsets, ...BeamboxPreference.read('module-offsets') };
    if (hasJobOrigin) {
      const refModule = getRefModule();
      if (offsets[refModule]) {
        const [refX, refY] = offsets[refModule];
        Object.keys(offsets).forEach((key) => {
          offsets[key] = [offsets[key][0] - refX, offsets[key][1] - refY];
        });
      }
    }
    config.mof = offsets;
  }

  const loopCompensation = Number(storage.get('loop_compensation') || '0');
  if (loopCompensation > 0) config.loop_compensation = loopCompensation;

  if (curveEngravingModeController.hasArea()) {
    const { bbox, points, gap, highest, lowest, objectHeight } = curveEngravingModeController.data;
    const data = {
      bbox,
      points: points.flat().filter((p) => p[2] !== null),
      gap,
      safe_height: Math.max(Math.min(highest, lowest - objectHeight), 0),
    };
    config.curve_engraving = data;
  }
  if (args) {
    Object.keys(config).forEach((key) => {
      if (['model', 'loop_compensation', 'curve_engraving', 'z_offset'].includes(key)) {
        // Skip special keys
      } else if (key === 'hardware_name') {
        args.push(`-${config[key]}`);
      } else if (key === 'af' && 'z_offset' in config) {
        // Handle optional -af value
        args.push('-af', config.z_offset.toString());
      } else {
        const keyArg = `-${key.replaceAll('_', '-')}`;
        if (config[key] === true) {
          args.push(keyArg);
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
        if (typeof val === 'number') return Math.round(val * 1e3) / 1e3;
        return val;
      });
    }
    return { loopCompensation: config.loop_compensation, curveEngravingData };
  }
  return { config };
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default (parserOpts: { type?: string; onFatal?: (data) => void }) => {
  parserOpts = parserOpts || {};

  const apiMethod = {
    svgeditor: 'svgeditor-laser-parser',
  }[parserOpts.type || 'svgeditor'];
  const events: { onMessage: (data?) => void; onError: (data?) => void } = {
    onMessage: () => {},
    onError: () => {},
  };
  const ws = Websocket({
    method: apiMethod,
    onMessage: (data) => events.onMessage(data),

    onError: (data) => events.onError(data),
    onFatal: (data) => {
      if (parserOpts.onFatal) parserOpts.onFatal(data);
      else events.onError(data);
    },
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
    async getTaskCode(names: string[], opts) {
      opts = opts || {};
      opts.onProgressing = opts.onProgressing || (() => {});
      opts.onFinished = opts.onFinished || (() => {});

      const args = ['go', names.join(' '), opts.fileMode || '-f'];
      const blobs = [];
      let duration;
      let totalLength = 0;
      let blob;
      let metadata;

      const { loopCompensation, curveEngravingData } = getExportOpt(opts, args);
      if (loopCompensation) await setParameter('loop_compensation', loopCompensation);
      if (curveEngravingData) await setParameter('curve_engraving', curveEngravingData);
      events.onMessage = (data) => {
        if (data.status === 'computing') {
          opts.onProgressing(data);
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
          opts.onError(data.message);
        }
      };
      ws.send(args.join(' '));
    },
    gcodeToFcode(
      taskData: { arrayBuffer: ArrayBuffer; thumbnailSize: number; size: number },
      opts
    ) {
      const $deferred = $.Deferred();
      const warningCollection = [];
      const args = ['g2f'];
      const blobs = [];
      let duration;
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
    divideSVG(opts?) {
      const $deferred = $.Deferred();
      opts = opts || {};
      opts.onProgressing = opts.onProgressing || (() => {});
      opts.onFinished = opts.onFinished || (() => {});

      const args = ['divide_svg'];
      const finalBlobs: { [key: string]: Blob | number } = {};
      let blobs = [];
      let currentLength = 0;
      let currentName = '';

      if (opts.scale) {
        args.push('-s');
        args.push(String(Math.floor(opts.scale * 100) / 100));
      }

      events.onMessage = (data) => {
        if (data.name) {
          currentName = data.name;
          currentLength = data.length;
          if (currentName === 'bitmap') {
            finalBlobs.bitmap_offset = data.offset;
          }
        } else if (data instanceof Blob) {
          blobs.push(data);
          const blob = new Blob(blobs);

          if (currentLength === blob.size) {
            blobs = [];
            finalBlobs[currentName] = blob;
          }
        } else if (data.status === 'ok') {
          $deferred.resolve({ res: true, data: finalBlobs });
        } else if (data.status === 'Error') {
          Progress.popById('loading_image');
          $deferred.resolve({ res: false, data: data.message });
        }
      };

      ws.send(args.join(' '));

      if (opts.timeout && opts.timeout > 0) {
        setTimeout(() => {
          $deferred.resolve({ res: false, data: 'timeout' });
        }, opts.timeout);
      }
      return $deferred.promise();
    },
    divideSVGbyLayer(opts?) {
      const $deferred = $.Deferred();
      opts = opts || {};
      opts.onProgressing = opts.onProgressing || (() => {});
      opts.onFinished = opts.onFinished || (() => {});

      const args = ['divide_svg_by_layer'];
      const finalBlobs: { [key: string]: Blob | number } = {};
      let blobs = [];
      let currentLength = 0;
      let currentName = '';

      if (opts.scale) {
        args.push('-s');
        args.push(String(Math.floor(opts.scale * 100) / 100));
      }

      events.onMessage = (data) => {
        if (data.name) {
          currentName = data.name;
          currentLength = data.length;
          if (currentName === 'bitmap') {
            finalBlobs.bitmap_offset = data.offset;
          }
        } else if (data instanceof Blob) {
          blobs.push(data);
          const blob = new Blob(blobs);

          if (currentLength === blob.size) {
            blobs = [];
            finalBlobs[currentName] = blob;
          }
        } else if (data.status === 'ok') {
          $deferred.resolve({ res: true, data: finalBlobs });
        } else if (data.status === 'Error') {
          Progress.popById('loading_image');
          $deferred.resolve({ res: false, data: data.message });
        }
      };

      ws.send(args.join(' '));
      return $deferred.promise();
    },
    uploadPlainSVG(file) {
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
        const pathMatch = p.match(/(.+)[/\\].+/);
        if (pathMatch[1]) return pathMatch[1];
        return '';
      };
      const reader = new FileReader();
      reader.onloadend = (e) => {
        let svgString = e.target.result as string;
        const matchImages = svgString.match(/<image[^>]+>/g);
        let allImageValid = true;
        let hasPath = false;
        if (matchImages) {
          const basename = getBasename(file.path);
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
            // Test Abosulte Path
            hasPath = true;
            if (fs.exists(newPath)) {
              continue;
            }
            // Test Relative Path
            if (file.path) {
              newPath = fs.join(basename, newPath);
              if (fs.exists(newPath)) {
                newPath = newPath
                  .replace(/&/g, '&amp;')
                  .replace(/'/g, '&apos;')
                  .replace(/"/g, '&quot;')
                  .replace(/>/g, '&gt;')
                  .replace(/</g, '&lt;');
                svgString = svgString.replace(
                  `xlink:href="${hrefCleaned}"`,
                  `xlink:href="${newPath}"`
                );
                continue;
              }
            }
            allImageValid = false;
            $deferred.resolve('invalid_path');
          }
        }
        if (allImageValid && hasPath && !AlertConfig.read('skip_image_path_warning')) {
          Alert.popUp({
            type: AlertConstants.SHOW_POPUP_WARNING,
            message: i18n.lang.beambox.popup.svg_image_path_waring,
            checkbox: {
              text: i18n.lang.beambox.popup.dont_show_again,
              callbacks: () => AlertConfig.write('skip_image_path_warning', true),
            },
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
          const hrefElem = document.querySelector(href);
          if (hrefElem) {
            defs += hrefElem.outerHTML;
          }
        }
      }
      const { x, y, width, height } = bbox;
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

    uploadToSvgeditorAPI(files, opts) {
      const $deferred = $.Deferred();
      let currIndex = 0;
      const orderName = 'svgeditor_upload';
      const setMessages = (file, isBroken, warningCollection) => {
        file.status = warningCollection.length > 0 ? 'bad' : 'good';
        file.messages = warningCollection;
        file.isBroken = isBroken;
        return file;
      };

      const sendFile = (file) => {
        const warningCollection = [];
        const CHUNK_SIZE = 128 * 1024; // 128KB
        const chunkCounts = Math.ceil(file.size / CHUNK_SIZE);

        events.onMessage = (data) => {
          switch (data.status) {
            case 'computing':
              opts.onProgressing(data);
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
              opts.onFinished();
              $deferred.resolve();
              break;
            case 'warning':
              warningCollection.push(data.message);
              break;
            case 'Error':
              opts.onError(data.message);
              $deferred.resolve();
              break;
            default:
              console.warn('Unknown Status:', data.status);
          }
        };

        events.onError = (data) => {
          warningCollection.push(data.message);
          opts.onError(data.message || data.symbol?.join('_') || String(data) || 'Unknown Error');
          $deferred.resolve();
        };
        const args = [orderName, file.uploadName, file.size, file.thumbnailSize];

        const rotaryMode = BeamboxPreference.read('rotary_mode');
        const extendRotaryWorkarea = BeamboxPreference.read('extend-rotary-workarea');
        if (rotaryMode && extendRotaryWorkarea) args.push('-spin');

        if (opts) {
          if (opts.model === 'fhexa1') args.push('-hexa');
          else if (opts.model === 'fbb1p') args.push('-pro');
          else if (opts.model === 'fbm1') args.push('-beamo');
          else args.push(`-${opts.model}`);

          if (typeof opts.engraveDpi === 'number') {
            args.push(`-dpi ${opts.engraveDpi}`);
          } else {
            switch (opts.engraveDpi) {
              case 'low':
                args.push('-ldpi');
                break;
              case 'medium':
                args.push('-mdpi');
                break;
              case 'high':
                args.push('-hdpi');
                break;
              case 'ultra':
                args.push('-udpi');
                break;
              default:
                args.push('-mdpi');
                break;
            }
          }
        }
        ws.send(args.join(' '));
      };

      $deferred.progress((action) => {
        let file;
        let hasBadFiles = false;

        if (action === 'next') {
          file = files[currIndex];

          if (typeof file === 'undefined') {
            hasBadFiles = files.some((f) => f.status === 'bad');
            $deferred.resolve({ files, hasBadFiles });
          } else if (file.extension && file.extension.toLowerCase() === 'svg') {
            sendFile(file);
            currIndex += 1;
            console.log('currIndex', currIndex);
          } else {
            setMessages(file, true, ['NOT_SUPPORT']);
            currIndex += 1;
            $deferred.notify('next');
          }
        }
      });

      $deferred.notify('next');

      return $deferred.promise();
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
  };
};
