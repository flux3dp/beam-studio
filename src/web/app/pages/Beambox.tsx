import BeamboxInit from '../actions/beambox/beambox-init'
import BeamboxGlobalInteraction from '../actions/beambox/beambox-global-interaction'
import BeamboxPreference from '../actions/beambox/beambox-preference'
import * as i18n from '../../helpers/i18n'
import { TopBar } from '../views/beambox/Top-Bar/Top-Bar'
import { TopBarContextProvider } from '../views/beambox/Top-Bar/contexts/Top-Bar-Context'
import { ZoomBlock } from '../views/beambox/Zoom-Block/Zoom-Block'
import { ZoomBlockContextProvider } from '../views/beambox/Zoom-Block/contexts/Zoom-Block-Context'
import SvgEditor from './svg-editor'
import { AlertsAndProgress } from '../views/dialogs/AlertsAndProgress'
import { Dialog } from '../views/dialogs/Dialog'
import { AlertProgressContextProvider } from '../contexts/AlertProgressContext'
import { DialogContextProvider } from '../contexts/DialogContext'

const electron = window['electron'];
    const React = requireNode('react');;
    const LANG = i18n.lang.beambox;
    BeamboxInit.init();

    class Beambox extends React.Component {
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
            BeamboxInit.showTutorial();
            BeamboxInit.checkOSVersion();
        }
        componentWillUnmount() {
            BeamboxGlobalInteraction.detach();
        }

        render() {
            return (
                <AlertProgressContextProvider>
                    <DialogContextProvider>
                        <div className="studio-container beambox-studio">
                            <TopBarContextProvider>
                                <TopBar />
                            </TopBarContextProvider>
                            <ZoomBlockContextProvider>
                                <ZoomBlock />
                            </ZoomBlockContextProvider>
                            <SvgEditor />
                            <div id='tool-panels-placeholder' />
                            <div id='image-trace-panel-placeholder' />
                            <Dialog index={0}/>
                            <AlertsAndProgress index={0}/>
                        </div>
                    </DialogContextProvider>
                </AlertProgressContextProvider>
            );
        }
    }
    export default () => Beambox;
