import Alert from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import Dialog from '@core/app/actions/dialog-caller';
import Progress from '@core/app/actions/progress-caller';
import TutorialConstants from '@core/app/constants/tutorial-constants';
import Discover from '@core/helpers/api/discover';
import i18n from '@core/helpers/i18n';

const LANG = i18n.lang.tutorial;
const getMachineForTutorial = async () =>
  new Promise((resolve) => {
    let discover = Discover('tutorial', (machines) => {
      if (machines.length > 0) {
        resolve(true);
        discover.removeListener('tutorial');
        discover = null;
      }
    });

    setTimeout(() => {
      if (discover) {
        resolve(false);
        discover.removeListener('tutorial');
        discover = null;
      }
    }, 3000);
  });

const startNewUserTutorial = async (callback: () => void): Promise<void> => {
  Progress.openNonstopProgress({
    id: 'tutorial-find-machine',
    message: LANG.look_for_machine,
  });

  const isAnyMachineAvailable = await getMachineForTutorial();

  Progress.popById('tutorial-find-machine');

  if (isAnyMachineAvailable) {
    const autoSwitch = beamboxPreference.read('auto-switch-tab');
    const tutorial = {
      ...TutorialConstants.NEW_USER_TUTORIAL,
      dialogStylesAndContents: autoSwitch
        ? TutorialConstants.NEW_USER_TUTORIAL.dialogStylesAndContents.filter(({ id }) => id !== 'switch-tab')
        : TutorialConstants.NEW_USER_TUTORIAL.dialogStylesAndContents,
    };

    Dialog.showTutorial(tutorial, callback);
  } else {
    const buttons = [
      {
        className: 'btn-default primary',
        label: LANG.set_connection,
        onClick: () => {
          window.location.hash = '#initialize/connect/select-machine-model';
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

const startInterfaceTutorial = (callback) => {
  Dialog.showTutorial(TutorialConstants.INTERFACE_TUTORIAL, callback);
};

export default {
  startInterfaceTutorial,
  startNewUserTutorial,
};
