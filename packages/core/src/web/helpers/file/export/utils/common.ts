import Alert from '@core/app/actions/alert-caller';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import i18n from '@core/helpers/i18n';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';
import communicator from '@core/implementations/communicator';

import { saveFile } from '../handlers/save';

export const getDefaultFileName = () => (currentFileManager.getName() || 'untitled').replace('/', ':');

export const switchSymbolWrapper = <T>(fn: () => T): T => {
  symbolMaker.switchImageSymbolForAll(false);

  try {
    return fn();
  } finally {
    symbolMaker.switchImageSymbolForAll(true);
  }
};

export const toggleUnsavedChangedDialog = async (): Promise<boolean> =>
  new Promise((resolve) => {
    communicator.send('SAVE_DIALOG_POPPED');

    if (!currentFileManager.getHasUnsavedChanges() || window.location.hash !== '#/studio/beambox') {
      resolve(true);
    } else {
      const { lang } = i18n;

      Alert.popById('unsaved_change_dialog');
      Alert.popUp({
        buttonLabels: [lang.alert.save, lang.alert.dont_save, lang.alert.cancel],
        callbacks: [
          async () => {
            if (await saveFile()) resolve(true);
          },
          () => resolve(true),
          () => resolve(false),
        ],
        id: 'unsaved_change_dialog',
        message: lang.beambox.popup.save_unsave_changed,
        primaryButtonIndex: 0,
      });
    }
  });
