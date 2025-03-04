import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import { executeFirmwareUpdate } from '@core/app/actions/beambox/menuDeviceActions';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import Dialog from '@core/app/actions/dialog-caller';
import { getSupportInfo } from '@core/app/constants/add-on';
import alertConstants from '@core/app/constants/alert-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import alertConfig from '@core/helpers/api/alert-config';
import round from '@core/helpers/math/round';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-maker';
import VersionChecker from '@core/helpers/version-checker';
import storage from '@core/implementations/storage';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { ILang } from '@core/interfaces/ILang';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const handleExportAlerts = async (device: IDeviceInfo, lang: ILang): Promise<boolean> => {
  const workarea = device.model;
  const isPromark = promarkModels.has(workarea);
  const workareaObj = getWorkarea(workarea);
  const layers = [...document.querySelectorAll('#svgcontent > g.layer:not([display="none"])')];
  const supportInfo = getSupportInfo(workarea);

  if (!constant.highPowerModels.includes(workarea)) {
    const isPowerTooHigh = layers.some((layer) => {
      const strength = Number(layer.getAttribute('data-strength'));
      const diode = Number(layer.getAttribute('data-diode'));

      return strength > 70 && diode !== 1;
    });

    if (!alertConfig.read('skip-high-power-confirm') && isPowerTooHigh) {
      const confirmed = await Dialog.showConfirmPromptDialog({
        alertConfigKey: 'skip-high-power-confirm',
        caption: lang.topbar.alerts.power_too_high,
        confirmValue: lang.topbar.alerts.power_too_high_confirm,
        message: lang.topbar.alerts.power_too_high_msg,
      });

      if (!confirmed) {
        return false;
      }
    }
  }

  const vc = VersionChecker(device.version);
  const isAdor = constant.adorModels.includes(device.model);

  if (!vc.meetRequirement(isAdor ? 'ADOR_PWM' : 'PWM')) {
    if (layers.some((layer) => layer.querySelector('image[data-pwm="1"]'))) {
      const res = await new Promise((resolve) => {
        alertCaller.popUp({
          buttonType: alertConstants.CONFIRM_CANCEL,
          message: lang.topbar.alerts.pwm_unavailable,
          onCancel: () => resolve(false),
          onConfirm: () => resolve(true),
          type: alertConstants.SHOW_POPUP_ERROR,
        });
      });

      if (res) {
        executeFirmwareUpdate(device);
      }

      return false;
    }
  }

  let hasJobOrigin = false;

  if (supportInfo.jobOrigin && beamboxPreference.read('enable-job-origin')) {
    if (!vc.meetRequirement(isAdor ? 'ADOR_JOB_ORIGIN' : 'JOB_ORIGIN')) {
      const res = await new Promise((resolve) => {
        alertCaller.popUp({
          buttonType: alertConstants.CONFIRM_CANCEL,
          message: lang.topbar.alerts.job_origin_unavailable,
          onCancel: () => resolve(false),
          onConfirm: () => resolve(true),
          type: alertConstants.SHOW_POPUP_ERROR,
        });
      });

      if (res) {
        executeFirmwareUpdate(device);
      }

      return false;
    }

    hasJobOrigin = true;
  }

  if (
    supportInfo.autoFeeder &&
    beamboxPreference.read('auto-feeder') &&
    !alertConfig.read('skip-auto-feeder-instruction')
  ) {
    let animationSrcs = [
      { src: 'video/bb2-auto-feeder/top-down.webm', type: 'video/webm' },
      { src: 'video/bb2-auto-feeder/top-down.mp4', type: 'video/mp4' },
    ];

    if (hasJobOrigin) {
      animationSrcs = [
        { src: 'video/bb2-auto-feeder/job-origin.webm', type: 'video/webm' },
        { src: 'video/bb2-auto-feeder/job-origin.mp4', type: 'video/mp4' },
      ];
    } else if (beamboxPreference.read('reverse-engraving')) {
      animationSrcs = [
        { src: 'video/bb2-auto-feeder/bottom-up.webm', type: 'video/webm' },
        { src: 'video/bb2-auto-feeder/bottom-up.mp4', type: 'video/mp4' },
      ];
    }

    await new Promise<void>((resolve) => {
      alertCaller.popUp({
        animationSrcs,
        callbacks: resolve,
        caption: lang.beambox.document_panel.auto_feeder,
        checkbox: {
          callbacks: () => {
            alertConfig.write('skip-auto-feeder-instruction', true);
            resolve();
          },
          text: lang.alert.dont_show_again,
        },
        message: lang.beambox.popup.auto_feeder_origin,
      });
    });
  }

  // Skip speed check for promark
  if (isPromark) return true;

  SymbolMaker.switchImageSymbolForAll(false);

  const { curveSpeedLimit } = workareaObj;
  const hasCurveSpeedLimit = curveEngravingModeController.hasArea() && supportInfo.curveEngraving && curveSpeedLimit;
  const handleCurveEngravingSpeedAlert = async (): Promise<void> => {
    if (!hasCurveSpeedLimit) {
      return;
    }

    let isTooFast = false;

    const tooFastLayers: string[] = [];

    for (let i = 0; i < layers.length; i += 1) {
      const layer = layers[i];

      if (
        Number.parseFloat(layer.getAttribute('data-speed') ?? '0') > curveSpeedLimit &&
        layer.getAttribute('display') !== 'none'
      ) {
        isTooFast = true;

        const layerName = svgCanvas.getCurrentDrawing().getLayerName(i);

        if (layerName) {
          tooFastLayers.push(layerName);
        }
      }
    }

    if (isTooFast) {
      await new Promise<void>((resolve) => {
        const limit =
          storage.get('default-units') === 'inches'
            ? `${round(curveSpeedLimit / 25.4, 2)} in/s`
            : `${curveSpeedLimit} mm/s`;

        if (!beamboxPreference.read('curve_engraving_speed_limit')) {
          if (!alertConfig.read('skip_curve_speed_warning')) {
            const message = sprintf(lang.beambox.popup.too_fast_for_curve, { limit });

            alertCaller.popUp({
              callbacks: () => resolve(),
              checkbox: {
                callbacks: () => {
                  alertConfig.write('skip_curve_speed_warning', true);
                  resolve();
                },
                text: lang.alert.dont_show_again,
              },
              message,
              type: alertConstants.SHOW_POPUP_WARNING,
            });
          } else {
            resolve();
          }
        } else if (!alertConfig.read('skip_curve_speed_limit_warning')) {
          const message = sprintf(lang.beambox.popup.too_fast_for_curve_and_constrain, {
            layers: tooFastLayers.join(', '),
            limit,
          });

          alertCaller.popUp({
            callbacks: () => resolve(),
            checkbox: {
              callbacks: () => {
                alertConfig.write('skip_curve_speed_limit_warning', true);
                resolve();
              },
              text: lang.alert.dont_show_again,
            },
            message,
            type: alertConstants.SHOW_POPUP_WARNING,
          });
        } else {
          resolve();
        }
      });
    }
  };

  await handleCurveEngravingSpeedAlert();

  const handleVectorSpeedAlert = async (): Promise<void> => {
    const { vectorSpeedLimit } = workareaObj;

    if (!vectorSpeedLimit) {
      return;
    }

    if (hasCurveSpeedLimit && vectorSpeedLimit >= curveSpeedLimit) {
      return;
    }

    const checkHighSpeed = (layer: Element) => {
      if (layer.getAttribute('display') === 'none') {
        return false;
      }

      const speed = Number.parseFloat(layer.getAttribute('data-speed') ?? '20');

      // already popped by curve speed alert
      if (hasCurveSpeedLimit && speed > curveSpeedLimit) {
        return false;
      }

      return speed > vectorSpeedLimit;
    };

    let isTooFast = false;
    const tooFastLayers: string[] = [];

    for (let i = 0; i < layers.length; i += 1) {
      const layer = layers[i];

      if (checkHighSpeed(layer)) {
        const paths: SVGElement[] = Array.from(layer.querySelectorAll('path, rect, ellipse, polygon, line'));
        const uses: SVGUseElement[] = Array.from(layer.querySelectorAll('use'));
        let hasWireframe = false;

        Array.from(uses).forEach((use: Element) => {
          const href = use.getAttribute('xlink:href');
          const elem = document.querySelector(`${href}`);

          if (!elem) {
            return;
          }

          paths.push(...(Array.from(elem.querySelectorAll('path, rect, ellipse, polygon, line')) as SVGElement[]));

          if (use.getAttribute('data-wireframe') === 'true') {
            isTooFast = true;
            hasWireframe = true;

            const layerName = svgCanvas.getCurrentDrawing().getLayerName(i);

            if (layerName) {
              tooFastLayers.push(layerName);
            }
          }
        });

        if (hasWireframe) {
          break;
        }

        for (let j = 0; j < paths.length; j += 1) {
          const path = paths[j];
          const fill = path.getAttribute('fill');
          const fillOpacity = Number.parseFloat(path.getAttribute('fill-opacity') ?? '1');

          if (fill === 'none' || fill === '#FFF' || fill === '#FFFFFF' || fillOpacity === 0) {
            isTooFast = true;

            const layerName = svgCanvas.getCurrentDrawing().getLayerName(i);

            if (layerName) {
              tooFastLayers.push(layerName);
            }

            break;
          }
        }
      }
    }
    SymbolMaker.switchImageSymbolForAll(true);

    if (isTooFast) {
      await new Promise<void>((resolve) => {
        const limit =
          storage.get('default-units') === 'inches'
            ? `${round(vectorSpeedLimit / 25.4, 2)} in/s`
            : `${vectorSpeedLimit} mm/s`;

        if (beamboxPreference.read('vector_speed_constraint')) {
          if (!alertConfig.read('skip_path_speed_warning')) {
            const message = sprintf(lang.beambox.popup.too_fast_for_path, { limit });

            alertCaller.popUp({
              callbacks: () => resolve(),
              checkbox: {
                callbacks: () => {
                  alertConfig.write('skip_path_speed_warning', true);
                  resolve();
                },
                text: lang.alert.dont_show_again,
              },
              message,
              type: alertConstants.SHOW_POPUP_WARNING,
            });
          } else {
            resolve();
          }
        } else if (!alertConfig.read('skip_path_speed_constraint_warning')) {
          const message = sprintf(lang.beambox.popup.too_fast_for_path_and_constrain, {
            layers: tooFastLayers.join(', '),
            limit,
          });

          alertCaller.popUp({
            callbacks: () => resolve(),
            checkbox: {
              callbacks: () => {
                alertConfig.write('skip_path_speed_constraint_warning', true);
                resolve();
              },
              text: lang.alert.dont_show_again,
            },
            message,
            type: alertConstants.SHOW_POPUP_WARNING,
          });
        } else {
          resolve();
        }
      });
    }
  };

  await handleVectorSpeedAlert();

  return true;
};
