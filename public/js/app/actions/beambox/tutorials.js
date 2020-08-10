define([
    'helpers/i18n',
    'app/actions/beambox/beambox-preference',
    'app/contexts/ProgressCaller',
    'app/contexts/AlertCaller',
    'jsx!constants/tutorial-constants',
    'jsx!contexts/DialogCaller',
    'helpers/api/discover',
    'helpers/device-list',
],function(
    i18n,
    BeamboxPreference,
    Progress,
    Alert,
    TutorialConstants,
    DialogCaller,
    Discover,
    DeviceList
){
    const LANG = i18n.lang.tutorial;
    const getMachineForTutorial = async () => {
        return new Promise((resolve) => {
            let discover = Discover('tutorial', (machines) => {
                const deviceList = DeviceList(machines);
                if (deviceList.length > 0) {
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
            DialogCaller.showTutorial(TutorialConstants.NEW_USER_TUTORIAL, callback);
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
        DialogCaller.showTutorial(TutorialConstants.INTERFACE_TUTORIAL, callback);
    }

    return {
        startNewUserTutorial,
        startInterfaceTutorial
    }
});