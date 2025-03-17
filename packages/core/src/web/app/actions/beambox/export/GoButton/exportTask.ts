import alertCaller from '@core/app/actions/alert-caller';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import constant from '@core/app/actions/beambox/constant';
import ExportFuncs from '@core/app/actions/beambox/export-funcs';
import { executeFirmwareUpdate } from '@core/app/actions/beambox/menuDeviceActions';
import { getAddOnInfo } from '@core/app/constants/add-on';
import alertConstants from '@core/app/constants/alert-constants';
import alertConfig from '@core/helpers/api/alert-config';
import checkOldFirmware from '@core/helpers/device/checkOldFirmware';
import promarkButtonHandler from '@core/helpers/device/promark/promark-button-handler';
import isDev from '@core/helpers/is-dev';
import VersionChecker from '@core/helpers/version-checker';
import type { IDeviceInfo } from '@core/interfaces/IDevice';
import type { ILang } from '@core/interfaces/ILang';

export const exportTask = async (device: IDeviceInfo, byHandler: boolean, lang: ILang): Promise<void> => {
  const showForceUpdateAlert = (id: string) => {
    alertCaller.popUp({
      buttonLabels: [lang.update.update],
      buttonType: alertConstants.CUSTOM_CANCEL,
      callbacks: () => executeFirmwareUpdate(device),
      id,
      message: lang.update.firmware.force_update_message,
      onCancel: () => {},
      type: alertConstants.SHOW_POPUP_ERROR,
    });
  };
  const { model, version } = device;
  const addOnInfo = getAddOnInfo(model);

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

  if (!res) {
    return;
  }

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
    addOnInfo.jobOrigin &&
    BeamboxPreference.read('enable-job-origin') &&
    !alertConfig.read('skip-job-origin-warning')
  ) {
    await new Promise((resolve) => {
      alertCaller.popUp({
        callbacks: () => resolve(null),
        checkbox: {
          callbacks: () => {
            alertConfig.write('skip-job-origin-warning', true);
            resolve(null);
          },
          text: lang.alert.dont_show_again,
        },
        message: lang.topbar.alerts.job_origin_warning,
        type: alertConstants.SHOW_POPUP_WARNING,
      });
    });
  }

  promarkButtonHandler.setStatus('uploading');

  await ExportFuncs.uploadFcode(device, byHandler);
};
