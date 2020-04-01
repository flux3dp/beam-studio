define([
    'app/actions/beambox/beambox-init',
    'app/actions/beambox/beambox-global-interaction',
    'app/actions/beambox/beambox-preference',
    'jsx!views/beambox/Left-Panels/Left-Panel',
    'jsx!views/beambox/Network-Testing-Panel',
    'jsx!pages/svg-editor',
    'jsx!/views/Alert',
    'jsx!/contexts/AlertContext'
], function (
    BeamboxInit,
    BeamboxGlobalInteraction,
    BeamboxPreference,
    LeftPanel,
    NetworkTestingPanel,
    SvgEditor,
    { Alert },
    { AlertContextProvider }
) {
    const React = require('react');
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
        }
        componentWillUnmount() {
            BeamboxGlobalInteraction.detach();
        }

        render() {
            return (
                <AlertContextProvider>
                    <div className="studio-container beambox-studio">
                        <LeftPanel />
                        <SvgEditor />
                        <NetworkTestingPanel />
                        <div id='document-panel-placeholder' />
                        <div id='object-panels-placeholder' />
                        <div id='tool-panels-placeholder' />
                        <div id='image-trace-panel-placeholder' />
                        <div id='photo-edit-panel-placeholder' />
                        <Alert stackLevel={0}/>
                    </div>
                </AlertContextProvider>
            );
        }
    }
    return () => view;
});
