import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import { executeFirmwareUpdate } from '@core/app/actions/beambox/menuDeviceActions';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import Dialog from '@core/app/actions/dialog-caller';
import { getAddOnInfo } from '@core/app/constants/addOn';
import alertConstants from '@core/app/constants/alert-constants';
import { getWarningSpeed } from '@core/app/constants/curveEngraving';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useCurveEngravingStore } from '@core/app/stores/curveEngravingStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { getStorage } from '@core/app/stores/storageStore';
import { getAutoFeeder } from '@core/helpers/addOn';
import alertConfig from '@core/helpers/api/alert-config';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import { getData } from '@core/helpers/layer/layer-config-helper';
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

  const handleSpeedAlert = async (): Promise<void> => {
    const curveSpeedLimit = isCurveEngravingTask
      ? getWarningSpeed(workarea, useCurveEngravingStore.getState().maxAngle)
      : null;
    const vectorSpeedLimit =
      (isAutoFeederTask && addOnInfo.autoFeeder?.vectorSpeedLimit) || workareaObj.vectorSpeedLimit;

    if (!curveSpeedLimit && !vectorSpeedLimit) return;

    const doLayerContainVectors = (layer: Element) => {
      const paths: SVGElement[] = Array.from(layer.querySelectorAll('path, rect, ellipse, polygon, line'));
      const uses: SVGUseElement[] = Array.from(layer.querySelectorAll('use'));

      Array.from(uses).forEach((use: Element) => {
        const href = use.getAttribute('xlink:href');
        const elem = document.querySelector(`${href}`);

        if (!elem) {
          return;
        }

        paths.push(...(Array.from(elem.querySelectorAll('path, rect, ellipse, polygon, line')) as SVGElement[]));

        if (use.getAttribute('data-wireframe') === 'true') {
          return true;
        }
      });

      return paths.some((path) => {
        const fill = path.getAttribute('fill');
        const fillOpacity = Number.parseFloat(path.getAttribute('fill-opacity') ?? '1');

        return fill === 'none' || fill === '#FFF' || fill === '#FFFFFF' || fillOpacity === 0;
      });
    };

    const isLayerTooFast = (layer: Element) => {
      if (layer.getAttribute('display') === 'none') {
        return { curve: false, vector: false };
      }

      const speed = getData(layer, 'speed') ?? 20;

      console.log(vectorSpeedLimit, doLayerContainVectors(layer));

      return {
        curve: curveSpeedLimit !== null && speed > curveSpeedLimit,
        vector: vectorSpeedLimit !== undefined && Boolean(speed > vectorSpeedLimit && doLayerContainVectors(layer)),
      };
    };

    SymbolMaker.switchImageSymbolForAll(false);

    const { curveLayers, vectorLayers } = layers.reduce(
      (acc, layer) => {
        const { curve, vector } = isLayerTooFast(layer);

        if (curve || vector) {
          const layerName = getLayerName(layer);

          if (curve) {
            acc.curveLayers.push(layerName);
          }

          if (vector) {
            acc.vectorLayers.push(layerName);
          }
        }

        return acc;
      },
      { curveLayers: [] as string[], vectorLayers: [] as string[] },
    );

    console.log(curveLayers, vectorLayers);

    SymbolMaker.switchImageSymbolForAll(true);

    if (curveLayers.length > 0) {
      await new Promise<void>((resolve) => {
        alertCaller.popUp({
          callbacks: () => resolve(),
          message: sprintf(lang.beambox.popup.too_fast_for_curve, { layers: curveLayers.join(', ') }),
          type: alertConstants.SHOW_POPUP_WARNING,
        });
      });
    }

    if (vectorLayers.length > 0) {
      await new Promise<void>((resolve) => {
        const limit = getStorage('isInch') ? `${round(vectorSpeedLimit! / 25.4, 2)} in/s` : `${vectorSpeedLimit!} mm/s`;

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
              layers: vectorLayers.join(', '),
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

  await handleSpeedAlert();

  return true;
};
