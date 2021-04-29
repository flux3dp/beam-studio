import * as i18n from 'helpers/i18n';
import BeamboxActions from 'app/actions/beambox';
import BeamboxInit from '../actions/beambox/beambox-init';
import BeamboxGlobalInteraction from '../actions/beambox/beambox-global-interaction';
import BeamboxPreference from '../actions/beambox/beambox-preference';
import { TopBar } from '../views/beambox/Top-Bar/Top-Bar';
import { TopBarContextProvider } from '../views/beambox/Top-Bar/contexts/Top-Bar-Context';
import { ZoomBlock } from '../views/beambox/Zoom-Block/Zoom-Block';
import { ZoomBlockContextProvider } from '../views/beambox/Zoom-Block/contexts/Zoom-Block-Context';
import { TimeEstimationButton } from '../views/beambox/Time-Estimation-Button/Time-Estimation-Button';
import SVGEditor from './svg-editor';
import svgEditor from '../actions/beambox/svg-editor';

const { electron } = window;
const React = requireNode('react');
const classNames = requireNode('classnames');

BeamboxInit.initSentry();
BeamboxInit.init();

class Beambox extends React.Component {
  async componentDidMount() {
    BeamboxGlobalInteraction.attach();

    // need to run after svgedit packages loaded, so place it at componentDidMouont
    if (BeamboxPreference.read('show_guides')) {
      BeamboxActions.drawGuideLines();
    }

    const { ipc, events } = electron;
    ipc.send(events.FRONTEND_READY);
    svgEditor.resetView();
    await BeamboxInit.showStartUpDialogs();
  }

  componentWillUnmount() {
    BeamboxGlobalInteraction.detach();
  }

  render() {
    const activeLang = i18n.getActiveLang();
    return (
      <div className={classNames('studio-container', 'beambox-studio', activeLang)}>
        <TopBarContextProvider>
          <TopBar />
        </TopBarContextProvider>
        <ZoomBlockContextProvider>
          <ZoomBlock />
        </ZoomBlockContextProvider>
        <TimeEstimationButton />
        <SVGEditor />
        <div id="tool-panels-placeholder" />
        <div id="image-trace-panel-placeholder" />
      </div>
    );
  }
}

export default () => Beambox;
