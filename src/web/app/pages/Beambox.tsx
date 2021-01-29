import BeamboxInit from '../actions/beambox/beambox-init'
import BeamboxGlobalInteraction from '../actions/beambox/beambox-global-interaction'
import BeamboxPreference from '../actions/beambox/beambox-preference'
import { TopBar } from '../views/beambox/Top-Bar/Top-Bar';
import { TopBarContextProvider } from '../views/beambox/Top-Bar/contexts/Top-Bar-Context';
import { ZoomBlock } from '../views/beambox/Zoom-Block/Zoom-Block';
import { ZoomBlockContextProvider } from '../views/beambox/Zoom-Block/contexts/Zoom-Block-Context';
import { TimeEstimationButton } from '../views/beambox/Time-Estimation-Button/Time-Estimation-Button';
import { SVGEditor } from './svg-editor';
import { AlertsAndProgress } from '../views/dialogs/AlertsAndProgress';
import { Dialog } from '../views/dialogs/Dialog';
import { AlertProgressContextProvider } from '../contexts/Alert-Progress-Context';
import { DialogContextProvider } from '../contexts/Dialog-Context';
import svgEditor from '../actions/beambox/svg-editor';
import * as i18n from 'helpers/i18n';

const electron = window['electron'];
const React = requireNode('react');
const classNames = requireNode('classnames');
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
        svgEditor.resetView();
    }
    componentWillUnmount() {
        BeamboxGlobalInteraction.detach();
    }

    render() {
        const activeLang = i18n.getActiveLang();
        return (
            <AlertProgressContextProvider>
                <DialogContextProvider>
                    <div className={classNames('studio-container', 'beambox-studio', activeLang)}>
                        <TopBarContextProvider>
                            <TopBar />
                        </TopBarContextProvider>
                        <ZoomBlockContextProvider>
                            <ZoomBlock />
                        </ZoomBlockContextProvider>
                        <TimeEstimationButton />
                        <SVGEditor />
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
