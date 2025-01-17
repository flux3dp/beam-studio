/* eslint-disable import/prefer-default-export */
import alertCaller from 'app/actions/alert-caller';
import alertConfig from 'helpers/api/alert-config';
import alertConstants from 'app/constants/alert-constants';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import constant from 'app/actions/beambox/constant';
import checkOldFirmware from 'helpers/device/checkOldFirmware';
import ExportFuncs from 'app/actions/beambox/export-funcs';
import isDev from 'helpers/is-dev';
import promarkButtonHandler from 'helpers/device/promark/promark-button-handler';
import VersionChecker from 'helpers/version-checker';

import { executeFirmwareUpdate } from 'app/actions/beambox/menuDeviceActions';
import { getSupportInfo } from 'app/constants/add-on';
import { IDeviceInfo } from 'interfaces/IDevice';
import { ILang } from 'interfaces/ILang';

export const exportTask = async (
  device: IDeviceInfo,
  byHandler: boolean,
  lang: ILang
): Promise<void> => {
  const showForceUpdateAlert = (id: string) => {
    alertCaller.popUp({
      id,
      message: lang.update.firmware.force_update_message,
      type: alertConstants.SHOW_POPUP_ERROR,
      buttonType: alertConstants.CUSTOM_CANCEL,
      buttonLabels: [lang.update.update],
      callbacks: () => executeFirmwareUpdate(device),
      onCancel: () => {},
    });
  };
  const { version, model } = device;
  const supportInfo = getSupportInfo(model);

  if (version === '4.1.1' && model !== 'fhexa1') {
    showForceUpdateAlert('4.1.1-version-alert');

    return;
  }

  const rotaryMode = BeamboxPreference.read('rotary_mode');
  // Check 4.1.5 / 4.1.6 rotary
  if (rotaryMode && ['4.1.5', '4.1.6'].includes(version) && model !== 'fhexa1') {
    showForceUpdateAlert('4.1.5,6-rotary-alert');
    return;
  }

  const versionCheckResult = VersionChecker(version);

  if (!isDev() && constant.adorModels.includes(model)) {
    if (!versionCheckResult.meetRequirement('ADOR_FCODE_V3')) {
      showForceUpdateAlert('ador-fcode-v3');
      return;
    }
    if (rotaryMode && !versionCheckResult.meetRequirement('ADOR_ROTARY')) {
      showForceUpdateAlert('ador-rotary');
      return;
    }
  }

  if (!versionCheckResult.meetRequirement('USABLE_VERSION')) {
    alertCaller.popUp({
      id: 'fatal-occurred',
      message: lang.beambox.popup.should_update_firmware_to_continue,
      type: alertConstants.SHOW_POPUP_ERROR,
    });

    return;
  }

  const res = await checkOldFirmware(device.version);

  if (!res) return;

  const currentWorkarea = BeamboxPreference.read('workarea') || BeamboxPreference.read('model');
  const allowedWorkareas = constant.allowedWorkarea[model];

  if (currentWorkarea && allowedWorkareas) {
    if (!allowedWorkareas.includes(currentWorkarea)) {
      alertCaller.popUp({
        id: 'workarea unavailable',
        message: lang.message.unavailableWorkarea,
        type: alertConstants.SHOW_POPUP_ERROR,
      });

      return;
    }
  }

  if (
    supportInfo.jobOrigin &&
    BeamboxPreference.read('enable-job-origin') &&
    !alertConfig.read('skip-job-origin-warning')
  ) {
    await new Promise((resolve) => {
      alertCaller.popUp({
        message: lang.topbar.alerts.job_origin_warning,
        type: alertConstants.SHOW_POPUP_WARNING,
        checkbox: {
          text: lang.beambox.popup.dont_show_again,
          callbacks: () => {
            alertConfig.write('skip-job-origin-warning', true);
            resolve(null);
          },
        },
        callbacks: () => resolve(null),
      });
    });
  }

  promarkButtonHandler.setStatus('uploading');

  await ExportFuncs.uploadFcode(device, byHandler);
};
