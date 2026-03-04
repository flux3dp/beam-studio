import React, { useEffect } from 'react';

import { Flex } from 'antd';
import classNames from 'classnames';

import BeamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import RightPanel from '@core/app/components/beambox/RightPanel';
import { ObjectPanelContextProvider } from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelContext';
import SvgEditor from '@core/app/components/beambox/SvgEditor';
import RealSvgEditor from '@core/app/components/beambox/SvgEditor/RealSvgEditor';
import TopBar from '@core/app/components/beambox/TopBar';
import ImageTracePanel from '@core/app/components/dialogs/ImageTracePanel/ImageTracePanel';
import CanvasTabBar from '@core/app/components/mobile/CanvasTabBar';
import { MenuEvents, MiscEvents } from '@core/app/constants/ipcEvents';
import { CanvasProvider } from '@core/app/contexts/CanvasContext';
import { SelectedElementContextProvider } from '@core/app/contexts/SelectedElementContext';
import { useStorageStore } from '@core/app/stores/storageStore';
import workareaManager from '@core/app/svgedit/workarea';
import DockViewLayout from '@core/app/widgets/dockable/DockViewLayout';
import ToolBarDrawerContainer from '@core/app/widgets/dockable/ToolBarDrawerContainer';
import { hashMap } from '@core/helpers/hashHelper';
import sentryHelper from '@core/helpers/sentry-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import BeamboxInit from '@core/implementations/beamboxInit';
import communicator from '@core/implementations/communicator';

import styles from './Beambox.module.scss';

import 'react-resizable/css/styles.css';

sentryHelper.initSentry();

const beamboxInit = new BeamboxInit();

const Beambox = (): React.JSX.Element => {
  const isMobile = useIsMobile();

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
          <ObjectPanelContextProvider>
            <ToolBarDrawerContainer />
            {isMobile ? (
              <>
                <RealSvgEditor />
                <RightPanel />
                <CanvasTabBar />
              </>
            ) : (
              <Flex className={styles.main}>
                <DockViewLayout />
                {/* Note: RightPanel in non mobile mode is used to handle PanelType changes */}
                <RightPanel />
              </Flex>
            )}
            {/* This is a temp place for SvgEditor, will be moved out&in */}
            <div id="safe-editor-container" style={{ display: 'none' }}>
              <SvgEditor />
            </div>
          </ObjectPanelContextProvider>
        </div>
        <ImageTracePanel />
      </SelectedElementContextProvider>
    </CanvasProvider>
  );
};

export default Beambox;
