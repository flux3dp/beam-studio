define([
    'app/actions/beambox/beambox-init',
    'app/actions/beambox/beambox-global-interaction',
    'app/actions/beambox/beambox-preference',
    'helpers/i18n',
    'helpers/local-storage',
    'jsx!views/beambox/Left-Panels/Left-Panel',
    'jsx!views/beambox/Network-Testing-Panel',
    'jsx!pages/svg-editor',
    'jsx!views/dialogs/Alert',
    'jsx!views/dialogs/Dialog',
    'jsx!/contexts/AlertContext',
    'jsx!/contexts/DialogContext',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'helpers/output-error',
], function (
    BeamboxInit,
    BeamboxGlobalInteraction,
    BeamboxPreference,
    i18n,
    localStorage,
    LeftPanel,
    NetworkTestingPanel,
    SvgEditor,
    { Alert },
    { Dialog },
    { AlertContextProvider },
    { DialogContextProvider },
    AlertCaller,
    AlertConstants,
    outputError
) {
    const React = require('react');
    const LANG = i18n.lang.beambox;
    BeamboxInit.init();

    class view extends React.Component {
        constructor(props) {
            super(props);
        }
        componentDidMount() {
            BeamboxGlobalInteraction.attach();

            // need to run after svgedit packages loaded, so place it at componentDidMouont
            if (BeamboxPreference.read('show_guides')) {
                BeamboxInit.displayGuides();
            }

            let ipc = electron.ipc;
            let events = electron.events;
            ipc.send(events.FRONTEND_READY);
        }
        componentWillUnmount() {
            BeamboxGlobalInteraction.detach();
        }

        render() {
            return (
                <AlertContextProvider>
                    <DialogContextProvider>
                        <div className="studio-container beambox-studio">
                            <LeftPanel />
                            <SvgEditor />
                            <div id='object-panels-placeholder' />
                            <div id='tool-panels-placeholder' />
                            <div id='image-trace-panel-placeholder' />
                            <Dialog index={0}/>
                            <Alert index={0}/>
                        </div>
                    </DialogContextProvider>
                </AlertContextProvider>
            );
        }
    }
    return () => view;
});
