import React from 'react';

import { Flex } from 'antd';
import classNames from 'classnames';

import BeamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import LeftPanel from '@core/app/components/beambox/left-panel/LeftPanel';
import PreviewSlider from '@core/app/components/beambox/PreviewSlider';
import RightPanel from '@core/app/components/beambox/right-panel/RightPanel';
import SvgEditor from '@core/app/components/beambox/svg-editor/SvgEditor';
import TimeEstimationButton from '@core/app/components/beambox/TimeEstimationButton';
import TopBar from '@core/app/components/beambox/top-bar/TopBar';
import CanvasTabBar from '@core/app/components/mobile/CanvasTabBar';
import { CanvasProvider } from '@core/app/contexts/CanvasContext';
import { SelectedElementContextProvider } from '@core/app/contexts/SelectedElementContext';
import { TimeEstimationButtonContextProvider } from '@core/app/contexts/TimeEstimationButtonContext';
import workareaManager from '@core/app/svgedit/workarea';
import ImageTracePanel from '@core/app/views/beambox/ImageTracePanel/ImageTracePanel';
import { LayerPanelContextProvider } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import { hashMap } from '@core/helpers/hashHelper';
import i18n from '@core/helpers/i18n';
import openFileHelper from '@core/helpers/open-file-helper';
import sentryHelper from '@core/helpers/sentry-helper';
import BeamboxInit from '@core/implementations/beamboxInit';
import communicator from '@core/implementations/communicator';

import styles from './Beambox.module.scss';
import 'react-resizable/css/styles.css';

sentryHelper.initSentry();

const beamboxInit = new BeamboxInit();

const Beambox = (): React.JSX.Element => {
  React.useEffect(() => {
    window.homePage = hashMap.editor;
    communicator.send('FRONTEND_READY');
    // Init view
    workareaManager.resetView();
    beamboxInit.showStartUpDialogs();
    openFileHelper.loadOpenFile();
    communicator.on('NEW_APP_MENU', BeamboxGlobalInteraction.attach);

    return () => {
      BeamboxGlobalInteraction.detach();
      communicator.off('NEW_APP_MENU', BeamboxGlobalInteraction.attach);
    };
  });

  const activeLang = i18n.getActiveLang();

  return (
    <CanvasProvider>
      <SelectedElementContextProvider>
        <LayerPanelContextProvider>
          <div className={classNames('studio-container', 'beambox-studio', activeLang, styles.container)}>
            <TopBar />
            <Flex className={styles.main}>
              <LeftPanel />
              <SvgEditor />
              <RightPanel />
            </Flex>
            <div id="tool-panels-placeholder" />
          </div>
          <div className={classNames(styles.buttons, { [styles.mac]: window.os === 'MacOS' })}>
            <TimeEstimationButtonContextProvider>
              <TimeEstimationButton />
            </TimeEstimationButtonContextProvider>
            <PreviewSlider />
          </div>
          <ImageTracePanel />
          <CanvasTabBar />
        </LayerPanelContextProvider>
      </SelectedElementContextProvider>
    </CanvasProvider>
  );
};

export default Beambox;
