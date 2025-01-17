/* eslint-disable import/prefer-default-export */
import { sprintf } from 'sprintf-js';

import alertCaller from 'app/actions/alert-caller';
import alertConfig from 'helpers/api/alert-config';
import alertConstants from 'app/constants/alert-constants';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import constant, { promarkModels } from 'app/actions/beambox/constant';
import Dialog from 'app/actions/dialog-caller';
import SymbolMaker from 'helpers/symbol-maker';
import storage from 'implementations/storage';
import VersionChecker from 'helpers/version-checker';
import { executeFirmwareUpdate } from 'app/actions/beambox/menuDeviceActions';
import { getSupportInfo } from 'app/constants/add-on';
import { getWorkarea } from 'app/constants/workarea-constants';
import { IDeviceInfo } from 'interfaces/IDevice';
import { ILang } from 'interfaces/ILang';
import { getSVGAsync } from 'helpers/svg-editor-helper';

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
        caption: lang.topbar.alerts.power_too_high,
        message: lang.topbar.alerts.power_too_high_msg,
        confirmValue: lang.topbar.alerts.power_too_high_confirm,
        alertConfigKey: 'skip-high-power-confirm',
      });
      if (!confirmed) return false;
    }
  }

  const vc = VersionChecker(device.version);
  const isAdor = constant.adorModels.includes(device.model);
  if (!vc.meetRequirement(isAdor ? 'ADOR_PWM' : 'PWM')) {
    if (layers.some((layer) => layer.querySelector('image[data-pwm="1"]'))) {
      const res = await new Promise((resolve) => {
        alertCaller.popUp({
          type: alertConstants.SHOW_POPUP_ERROR,
          message: lang.topbar.alerts.pwm_unavailable,
          buttonType: alertConstants.CONFIRM_CANCEL,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (res) executeFirmwareUpdate(device);
      return false;
    }
  }
  if (supportInfo.jobOrigin && !vc.meetRequirement(isAdor ? 'ADOR_JOB_ORIGIN' : 'JOB_ORIGIN')) {
    if (BeamboxPreference.read('enable-job-origin')) {
      const res = await new Promise((resolve) => {
        alertCaller.popUp({
          type: alertConstants.SHOW_POPUP_ERROR,
          message: lang.topbar.alerts.job_origin_unavailable,
          buttonType: alertConstants.CONFIRM_CANCEL,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (res) executeFirmwareUpdate(device);
      return false;
    }
  }

  // Skip speed check for promark
  if (isPromark) return true;

  SymbolMaker.switchImageSymbolForAll(false);
  let isTooFastForPath = false;
  const tooFastLayers = [];
  for (let i = 0; i < layers.length; i += 1) {
    const layer = layers[i];
    if (
      vectorSpeedLimit &&
      parseFloat(layer.getAttribute('data-speed')) > vectorSpeedLimit &&
      layer.getAttribute('display') !== 'none'
    ) {
      const paths = Array.from($(layer).find('path, rect, ellipse, polygon, line'));
      const uses = $(layer).find('use');
      let hasWireframe = false;
      // eslint-disable-next-line @typescript-eslint/no-loop-func
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
        const fillOpacity = parseFloat($(path).attr('fill-opacity'));
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
            message,
            type: alertConstants.SHOW_POPUP_WARNING,
            checkbox: {
              text: lang.beambox.popup.dont_show_again,
              callbacks: () => {
                alertConfig.write('skip_path_speed_warning', true);
                resolve(null);
              },
            },
            callbacks: () => resolve(null),
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
          message,
          type: alertConstants.SHOW_POPUP_WARNING,
          checkbox: {
            text: lang.beambox.popup.dont_show_again,
            callbacks: () => {
              alertConfig.write('skip_path_speed_constraint_warning', true);
              resolve(null);
            },
          },
          callbacks: () => resolve(null),
        });
      } else {
        resolve(null);
      }
    });
  }
  return true;
};
