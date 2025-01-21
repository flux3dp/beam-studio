import React from 'react';
import classNames from 'classnames';

import BeamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import BeamboxInit from '@app/implementations/beamboxInit';
import BeamboxPreference from '@core/app/actions/beambox/beambox-preference';
import CanvasTabBar from '@core/app/components/mobile/CanvasTabBar';
import communicator from '@app/implementations/communicator';
import i18n from '@core/helpers/i18n';
import ImageTracePanel from '@core/app/views/beambox/ImageTracePanel/ImageTracePanel';
import LeftPanel from '@core/app/components/beambox/left-panel/LeftPanel';
import openFileHelper from '@core/helpers/open-file-helper';
import PreviewSlider from '@core/app/components/beambox/PreviewSlider';
import RightPanel from '@core/app/components/beambox/right-panel/RightPanel';
import sentryHelper from '@core/helpers/sentry-helper';
import SvgEditor from '@core/app/components/beambox/svg-editor/SvgEditor';
import TimeEstimationButton from '@core/app/components/beambox/TimeEstimationButton';
import TopBar from '@core/app/components/beambox/top-bar/TopBar';
import workareaManager from '@core/app/svgedit/workarea';
import { CanvasProvider } from '@core/app/contexts/CanvasContext';
import { LayerPanelContextProvider } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import { SelectedElementContextProvider } from '@core/app/contexts/SelectedElementContext';
import { TimeEstimationButtonContextProvider } from '@core/app/contexts/TimeEstimationButtonContext';

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
