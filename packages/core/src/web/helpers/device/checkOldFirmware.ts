import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import alertConfig from '@core/helpers/api/alert-config';
import i18n from '@core/helpers/i18n';
import versionChecker from '@core/helpers/version-checker';

// TODO: add unit test
const checkOldFirmware = async (version: string): Promise<boolean> => {
  const lang = i18n.lang.beambox.popup;
  const vc = versionChecker(version);

  if (!vc.meetRequirement('BEAM_STUDIO_2') && !alertConfig.read('skip-old-firmware-hint-2')) {
    const res = await new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        buttonLabels: [lang.still_continue],
        buttonType: alertConstants.CUSTOM_CANCEL,
        callbacks: () => resolve(true),
        checkbox: {
          callbacks: [
            () => {
              alertConfig.write('skip-old-firmware-hint-2', true);
              resolve(true);
            },
            () => resolve(false),
          ],
          text: lang.dont_show_again,
        },
        id: 'old-firmware',
        message: lang.recommend_upgrade_firmware,
        onCancel: () => resolve(false),
        type: alertConstants.SHOW_POPUP_INFO,
      });
    });

    return res;
  }

  return true;
};

export default checkOldFirmware;
