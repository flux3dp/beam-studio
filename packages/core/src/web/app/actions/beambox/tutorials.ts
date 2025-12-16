import Alert from '@core/app/actions/alert-caller';
import Dialog from '@core/app/actions/dialog-caller';
import Progress from '@core/app/actions/progress-caller';
import { generateInterfaceTutorial, generateNewUserTutorial } from '@core/app/constants/tutorial-constants';
import { discoverManager } from '@core/helpers/api/discover';
import getDevice from '@core/helpers/device/get-device';
import { hashMap } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';

const getMachineForTutorial = async () =>
  new Promise((resolve) => {
    let resolved = false;
    const unregister = discoverManager.register('tutorial', (machines) => {
      if (machines.length > 0) {
        resolve(true);
        unregister();
        resolved = true;
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolve(false);
        unregister();
      }
    }, 3000);
  });

const startNewUserTutorial = async (callback: () => void): Promise<void> => {
  const LANG = i18n.lang.tutorial;

  Progress.openNonstopProgress({
    id: 'tutorial-find-machine',
    message: LANG.look_for_machine,
  });

  const isAnyMachineAvailable = await getMachineForTutorial();

  Progress.popById('tutorial-find-machine');

  if (isAnyMachineAvailable) {
    const { device } = await getDevice();

    if (!device) return;

    const newUserTutorial = generateNewUserTutorial(device.model);

    Dialog.showTutorial(newUserTutorial, callback);
  } else {
    const buttons = [
      {
        className: 'btn-default primary',
        label: LANG.set_connection,
        onClick: () => {
          window.location.hash = hashMap.machineSetup;
        },
      },
      {
        className: 'btn-default primary',
        label: LANG.retry,
        onClick: () => startNewUserTutorial(callback),
      },
      {
        className: 'btn-default',
        label: LANG.skip,
        onClick: () => {
          Alert.popUp({
            message: LANG.skip_tutorial,
          });
        },
      },
    ];

    Alert.popUp({
      buttons,
      message: LANG.unable_to_find_machine,
    });
  }
};

const startInterfaceTutorial = (callback: () => void) => {
  Dialog.showTutorial(generateInterfaceTutorial(), callback);
};

export default {
  startInterfaceTutorial,
  startNewUserTutorial,
};
