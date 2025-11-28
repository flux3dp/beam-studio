import React from 'react';

import { Flex } from 'antd';
import classNames from 'classnames';

import BeamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import LeftPanel from '@core/app/components/beambox/LeftPanel';
import RightPanel from '@core/app/components/beambox/right-panel/RightPanel';
import SvgEditor from '@core/app/components/beambox/svg-editor/SvgEditor';
import TopBar from '@core/app/components/beambox/top-bar/TopBar';
import CanvasTabBar from '@core/app/components/mobile/CanvasTabBar';
import { CanvasProvider } from '@core/app/contexts/CanvasContext';
import { SelectedElementContextProvider } from '@core/app/contexts/SelectedElementContext';
import { useStorageStore } from '@core/app/stores/storageStore';
import workareaManager from '@core/app/svgedit/workarea';
import ImageTracePanel from '@core/app/views/beambox/ImageTracePanel/ImageTracePanel';
import { LayerPanelContextProvider } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import { hashMap } from '@core/helpers/hashHelper';
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

    communicator.on('NEW_APP_MENU', BeamboxGlobalInteraction.attach);

    return () => {
      BeamboxGlobalInteraction.detach();
      communicator.off('NEW_APP_MENU', BeamboxGlobalInteraction.attach);
    };
  });

  const activeLang = useStorageStore((state) => state['active-lang']) ?? 'en';

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
          <ImageTracePanel />
          <CanvasTabBar />
        </LayerPanelContextProvider>
      </SelectedElementContextProvider>
    </CanvasProvider>
  );
};

export default Beambox;
