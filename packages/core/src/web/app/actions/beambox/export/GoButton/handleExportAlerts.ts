import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import { executeFirmwareUpdate } from '@core/app/actions/beambox/menuDeviceActions';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import Dialog from '@core/app/actions/dialog-caller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import alertConstants from '@core/app/constants/alert-constants';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { getStorage } from '@core/app/stores/storageStore';
import { getAutoFeeder } from '@core/helpers/addOn';
import alertConfig from '@core/helpers/api/alert-config';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import { getLayerName } from '@core/helpers/layer/layer-helper';
import { hasModuleLayer } from '@core/helpers/layer-module/layer-module-helper';
import round from '@core/helpers/math/round';
import SymbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import VersionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { ILang } from '@core/interfaces/ILang';

export const handleExportAlerts = async (device: IDeviceInfo, lang: ILang): Promise<boolean> => {
  const workarea = device.model;
  const isPromark = promarkModels.has(workarea);
  const workareaObj = getWorkarea(workarea);
  const layers = [...document.querySelectorAll('#svgcontent > g.layer:not([display="none"])')];
  const addOnInfo = getAddOnInfo(workarea);
  const isAutoFeederTask = getAutoFeeder(addOnInfo);
  const isCurveEngravingTask = curveEngravingModeController.hasArea() && addOnInfo.curveEngraving;

  if (
    isCurveEngravingTask &&
    workarea === 'fbm2' &&
    hasModuleLayer(
      workareaObj.supportedModules!.filter(
        (module) => ![LayerModule.LASER_UNIVERSAL, LayerModule.UV_PRINT].includes(module),
      ),
      { checkRepeat: true, checkVisible: true },
    )
  ) {
    alertCaller.popUp({
      message: lang.beambox.popup.no_curve_engraving_with_modules,
    });

    return false;
  }

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
  const { 'enable-job-origin': enableJobOrigin, rotary_mode: rotaryMode } = useDocumentStore.getState();

  if (addOnInfo.jobOrigin && enableJobOrigin) {
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

  const globalPreference = useGlobalPreferenceStore.getState();

  if (isAutoFeederTask && !alertConfig.read('skip-auto-feeder-instruction')) {
    let animationSrcs = [
      { src: 'video/bb2-auto-feeder/top-down.webm', type: 'video/webm' },
      { src: 'video/bb2-auto-feeder/top-down.mp4', type: 'video/mp4' },
    ];

    if (hasJobOrigin) {
      animationSrcs = [
        { src: 'video/bb2-auto-feeder/job-origin.webm', type: 'video/webm' },
        { src: 'video/bb2-auto-feeder/job-origin.mp4', type: 'video/mp4' },
      ];
    } else if (globalPreference['reverse-engraving']) {
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

  if (isPromark) {
    if (rotaryMode && !swiftrayClient.checkVersion('PROMARK_ROTARY')) {
      return false;
    }

    // Skip speed check for promark
    return true;
  }

  SymbolMaker.switchImageSymbolForAll(false);

  const handleVectorSpeedAlert = async (): Promise<void> => {
    const curveSpeedLimit = workareaObj.curveSpeedLimit?.x;
    const hasCurveSpeedLimit = isCurveEngravingTask && curveSpeedLimit;
    const vectorSpeedLimit =
      (isAutoFeederTask && addOnInfo.autoFeeder?.vectorSpeedLimit) || workareaObj.vectorSpeedLimit;

    if (!vectorSpeedLimit) return;

    if (hasCurveSpeedLimit && vectorSpeedLimit >= curveSpeedLimit) return;

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

            const layerName = getLayerName(layer);

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

            const layerName = getLayerName(layer);

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
        const limit = getStorage('isInch') ? `${round(vectorSpeedLimit / 25.4, 2)} in/s` : `${vectorSpeedLimit} mm/s`;

        if (!globalPreference['vector_speed_constraint']) {
          if (!alertConfig.read('skip_path_speed_warning')) {
            const message = sprintf(
              isAutoFeederTask ? lang.beambox.popup.too_fast_for_auto_feeder : lang.beambox.popup.too_fast_for_path,
              { limit },
            );

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
          const message = sprintf(
            isAutoFeederTask
              ? lang.beambox.popup.too_fast_for_auto_feeder_and_constrain
              : lang.beambox.popup.too_fast_for_path_and_constrain,
            {
              layers: tooFastLayers.join(', '),
              limit,
            },
          );

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
