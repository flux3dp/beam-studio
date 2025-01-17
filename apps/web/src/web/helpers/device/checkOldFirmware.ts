import alertCaller from 'app/actions/alert-caller';
import alertConfig from 'helpers/api/alert-config';
import alertConstants from 'app/constants/alert-constants';
import i18n from 'helpers/i18n';
import versionChecker from 'helpers/version-checker';

// TODO: add unit test
const checkOldFirmware = async (version: string): Promise<boolean> => {
  const lang = i18n.lang.beambox.popup;
  const vc = versionChecker(version);
  if (!vc.meetRequirement('BEAM_STUDIO_2') && !alertConfig.read('skip-old-firmware-hint-2')) {
    const res = await new Promise<boolean>((resolve) => {
      alertCaller.popUp({
        id: 'old-firmware',
        type: alertConstants.SHOW_POPUP_INFO,
        message: lang.recommend_upgrade_firmware,
        buttonType: alertConstants.CUSTOM_CANCEL,
        buttonLabels: [lang.still_continue],
        callbacks: () => resolve(true),
        onCancel: () => resolve(false),
        checkbox: {
          text: lang.dont_show_again,
          callbacks: [
            () => {
              alertConfig.write('skip-old-firmware-hint-2', true);
              resolve(true);
            },
            () => resolve(false),
          ],
        },
      });
    });
    return res;
  }
  return true;
};

export default checkOldFirmware;
