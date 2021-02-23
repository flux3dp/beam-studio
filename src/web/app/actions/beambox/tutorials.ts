import * as i18n from '../../../helpers/i18n';
import Progress from '../progress-caller';
import Alert from '../alert-caller';
import TutorialConstants from '../../constants/tutorial-constants';
import Dialog from '../dialog-caller';
import Discover from '../../../helpers/api/discover';
import DeviceList from '../../../helpers/device-list';

const LANG = i18n.lang.tutorial;
const getMachineForTutorial = async () => {
    return new Promise((resolve) => {
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
};

const startNewUserTutorial = async (callback) => {
    Progress.openNonstopProgress({
        id: 'tutorial-find-machine',
        message: LANG.look_for_machine,
    });
    const isAnyMachineAvailable = await getMachineForTutorial();
    Progress.popById('tutorial-find-machine');
    if (isAnyMachineAvailable) {
        Dialog.showTutorial(TutorialConstants.NEW_USER_TUTORIAL, callback);
    } else {
        const buttons = [
            {
                label: LANG.set_connection,
                className: 'btn-default primary',
                onClick: () => location.hash = '#initialize/connect/select-connection-type',
            },
            {
                label: LANG.retry,
                className: 'btn-default primary',
                onClick: () => startNewUserTutorial(callback),
            },
            {
                label: LANG.skip,
                className: 'btn-default',
                onClick: () => {
                    Alert.popUp({
                        message: LANG.skip_tutorial,
                    });
                }
            },
        ];
        Alert.popUp({
            message: LANG.unable_to_find_machine,
            buttons
        });
    }
};

const startInterfaceTutorial = (callback) => {
    Dialog.showTutorial(TutorialConstants.INTERFACE_TUTORIAL, callback);
}

export default {
    startNewUserTutorial,
    startInterfaceTutorial
};
