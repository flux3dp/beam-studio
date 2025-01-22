import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import { executeFirmwareUpdate } from '@core/app/actions/beambox/menuDeviceActions';
import Dialog from '@core/app/actions/dialog-caller';
import { getSupportInfo } from '@core/app/constants/add-on';
import alertConstants from '@core/app/constants/alert-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import alertConfig from '@core/helpers/api/alert-config';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import SymbolMaker from '@core/helpers/symbol-maker';
import VersionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { ILang } from '@core/interfaces/ILang';

import storage from '@app/implementations/storage';

let svgCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

const { $ } = window;

export const handleExportAlerts = async (device: IDeviceInfo, lang: ILang): Promise<boolean> => {
  const workarea = device.model;
  const isPromark = promarkModels.has(workarea);
  const { vectorSpeedLimit } = getWorkarea(workarea);
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

  if (supportInfo.jobOrigin && !vc.meetRequirement(isAdor ? 'ADOR_JOB_ORIGIN' : 'JOB_ORIGIN')) {
    if (BeamboxPreference.read('enable-job-origin')) {
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
  }

  // Skip speed check for promark
  if (isPromark) {
    return true;
  }

  SymbolMaker.switchImageSymbolForAll(false);

  let isTooFastForPath = false;
  const tooFastLayers = [];

  for (let i = 0; i < layers.length; i += 1) {
    const layer = layers[i];

    if (
      vectorSpeedLimit &&
      Number.parseFloat(layer.getAttribute('data-speed')) > vectorSpeedLimit &&
      layer.getAttribute('display') !== 'none'
    ) {
      const paths = Array.from($(layer).find('path, rect, ellipse, polygon, line'));
      const uses = $(layer).find('use');
      let hasWireframe = false;

      Array.from(uses).forEach((use: Element) => {
        const href = use.getAttribute('xlink:href');

        paths.push(...Array.from($(`${href}`).find('path, rect, ellipse, polygon, line')));

        if (use.getAttribute('data-wireframe') === 'true') {
          isTooFastForPath = true;
          hasWireframe = true;
          tooFastLayers.push(svgCanvas.getCurrentDrawing().getLayerName(i));
        }
      });

      if (hasWireframe) {
        break;
      }

      for (let j = 0; j < paths.length; j += 1) {
        const path = paths[j];
        const fill = $(path).attr('fill');
        const fillOpacity = Number.parseFloat($(path).attr('fill-opacity'));

        if (fill === 'none' || fill === '#FFF' || fill === '#FFFFFF' || fillOpacity === 0) {
          isTooFastForPath = true;
          tooFastLayers.push(svgCanvas.getCurrentDrawing().getLayerName(i));
          break;
        }
      }
    }
  }
  SymbolMaker.switchImageSymbolForAll(true);

  if (isTooFastForPath) {
    await new Promise((resolve) => {
      const limit =
        storage.get('default-units') === 'inches'
          ? `${(vectorSpeedLimit / 25.4).toFixed(2)} in/s`
          : `${vectorSpeedLimit} mm/s`;

      if (BeamboxPreference.read('vector_speed_contraint') === false) {
        if (!alertConfig.read('skip_path_speed_warning')) {
          const message = sprintf(lang.beambox.popup.too_fast_for_path, { limit });

          alertCaller.popUp({
            callbacks: () => resolve(null),
            checkbox: {
              callbacks: () => {
                alertConfig.write('skip_path_speed_warning', true);
                resolve(null);
              },
              text: lang.beambox.popup.dont_show_again,
            },
            message,
            type: alertConstants.SHOW_POPUP_WARNING,
          });
        } else {
          resolve(null);
        }
      } else if (!alertConfig.read('skip_path_speed_constraint_warning')) {
        const message = sprintf(lang.beambox.popup.too_fast_for_path_and_constrain, {
          layers: tooFastLayers.join(', '),
          limit,
        });

        alertCaller.popUp({
          callbacks: () => resolve(null),
          checkbox: {
            callbacks: () => {
              alertConfig.write('skip_path_speed_constraint_warning', true);
              resolve(null);
            },
            text: lang.beambox.popup.dont_show_again,
          },
          message,
          type: alertConstants.SHOW_POPUP_WARNING,
        });
      } else {
        resolve(null);
      }
    });
  }

  return true;
};
