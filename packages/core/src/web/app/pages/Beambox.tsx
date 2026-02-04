import React, { useEffect } from 'react';

import { Flex } from 'antd';
import classNames from 'classnames';

import BeamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import LeftPanel from '@core/app/components/beambox/LeftPanel';
import RightPanel from '@core/app/components/beambox/RightPanel';
import SvgEditor from '@core/app/components/beambox/svg-editor/SvgEditor';
import TopBar from '@core/app/components/beambox/TopBar';
import CanvasTabBar from '@core/app/components/mobile/CanvasTabBar';
import { MenuEvents, MiscEvents } from '@core/app/constants/ipcEvents';
import { CanvasProvider } from '@core/app/contexts/CanvasContext';
import { SelectedElementContextProvider } from '@core/app/contexts/SelectedElementContext';
import { useStorageStore } from '@core/app/stores/storageStore';
import workareaManager from '@core/app/svgedit/workarea';
import ImageTracePanel from '@core/app/views/beambox/ImageTracePanel/ImageTracePanel';
import { hashMap } from '@core/helpers/hashHelper';
import sentryHelper from '@core/helpers/sentry-helper';
import BeamboxInit from '@core/implementations/beamboxInit';
import communicator from '@core/implementations/communicator';

import styles from './Beambox.module.scss';

import 'react-resizable/css/styles.css';

sentryHelper.initSentry();

const beamboxInit = new BeamboxInit();

const Beambox = (): React.JSX.Element => {
  useEffect(() => {
    window.homePage = hashMap.editor;
    communicator.send(MiscEvents.FrontendReady);
    // Init view
    workareaManager.resetView();
    beamboxInit.showStartUpDialogs();

    communicator.on(MenuEvents.NewAppMenu, BeamboxGlobalInteraction.attach);

    return () => {
      BeamboxGlobalInteraction.detach();
      communicator.off(MenuEvents.NewAppMenu, BeamboxGlobalInteraction.attach);
    };
  }, []);

  const activeLang = useStorageStore((state) => state['active-lang']) ?? 'en';

  return (
    <CanvasProvider>
      <SelectedElementContextProvider>
        <div className={classNames('studio-container', 'beambox-studio', activeLang, styles.container)}>
          <TopBar />
          <Flex className={styles.main}>
            <LeftPanel />
            <SvgEditor />
            <RightPanel />
            <CanvasTabBar />
          </Flex>
        </div>
        <ImageTracePanel />
      </SelectedElementContextProvider>
    </CanvasProvider>
  );
};

export default Beambox;
