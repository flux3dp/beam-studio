import Alert from '@core/app/actions/alert-caller';
import { MiscEvents } from '@core/app/constants/ipcEvents';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import i18n from '@core/helpers/i18n';
import communicator from '@core/implementations/communicator';

import { saveFile } from '../handlers/save';

/**
 * Ask what to do about unsaved work before leaving the scene.
 *
 * Kept out of `utils/common` on purpose: this is the only thing in that folder that reaches back
 * into the save handlers, and through them into the whole export preprocessing chain. Leaving it
 * there made every importer of `switchSymbolWrapper` pull all of that in.
 *
 * @returns false when the user cancelled, meaning stay where they are.
 */
export const toggleUnsavedChangedDialog = async (): Promise<boolean> =>
  new Promise((resolve) => {
    communicator.send(MiscEvents.SaveDialogPopped);

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

export default toggleUnsavedChangedDialog;
