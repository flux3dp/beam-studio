import React from 'react';
import classNames from 'classnames';

import BeamboxGlobalInteraction from 'app/actions/beambox/beambox-global-interaction';
import BeamboxInit from 'implementations/beamboxInit';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import CanvasTabBar from 'app/components/mobile/CanvasTabBar';
import communicator from 'implementations/communicator';
import i18n from 'helpers/i18n';
import ImageTracePanel from 'app/views/beambox/ImageTracePanel/ImageTracePanel';
import LeftPanel from 'app/components/beambox/left-panel/LeftPanel';
import openFileHelper from 'helpers/open-file-helper';
import PreviewSlider from 'app/components/beambox/PreviewSlider';
import RightPanel from 'app/components/beambox/right-panel/RightPanel';
import sentryHelper from 'helpers/sentry-helper';
import SvgEditor from 'app/components/beambox/svg-editor/SvgEditor';
import TimeEstimationButton from 'app/components/beambox/TimeEstimationButton';
import TopBar from 'app/components/beambox/top-bar/TopBar';
import workareaManager from 'app/svgedit/workarea';
import { CanvasProvider } from 'app/contexts/CanvasContext';
import { LayerPanelContextProvider } from 'app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import { SelectedElementContextProvider } from 'app/contexts/SelectedElementContext';
import { TimeEstimationButtonContextProvider } from 'app/contexts/TimeEstimationButtonContext';

import styles from './Beambox.module.scss';
import 'react-resizable/css/styles.css';

sentryHelper.initSentry();
const beamboxInit = new BeamboxInit();

const Beambox = (): JSX.Element => {
  React.useEffect(() => {
    BeamboxGlobalInteraction.attach();

    communicator.send('FRONTEND_READY');
    // Init view
    workareaManager.resetView();
    beamboxInit.showStartUpDialogs();
    openFileHelper.loadOpenFile();
    if (BeamboxPreference.read('zoom_with_window')) {
      window.addEventListener('resize', workareaManager.resetView);
    }

    return () => {
      BeamboxGlobalInteraction.detach();
    };
  });

  const activeLang = i18n.getActiveLang();
  return (
    <CanvasProvider>
      <SelectedElementContextProvider>
        <LayerPanelContextProvider>
          <div className={classNames('studio-container', 'beambox-studio', activeLang)}>
            <TopBar />
            <LeftPanel />
            <RightPanel />
            <SvgEditor />
            <div className={classNames(styles.buttons, { [styles.mac]: window.os === 'MacOS' })}>
              <TimeEstimationButtonContextProvider>
                <TimeEstimationButton />
              </TimeEstimationButtonContextProvider>
              <PreviewSlider />
            </div>
            <div id="tool-panels-placeholder" />
            <ImageTracePanel />
            <CanvasTabBar />
          </div>
        </LayerPanelContextProvider>
      </SelectedElementContextProvider>
    </CanvasProvider>
  );
};

export default Beambox;
