import React, { useCallback, useEffect } from 'react';

import { Flex } from 'antd';
import classNames from 'classnames';

import BeamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import RightPanel from '@core/app/components/beambox/right-panel/RightPanel';
import RealSvgEditor from '@core/app/components/beambox/svg-editor/RealSvgEditor';
import SvgEditor from '@core/app/components/beambox/svg-editor/SvgEditor';
import TopBar from '@core/app/components/beambox/top-bar/TopBar';
import CanvasTabBar from '@core/app/components/mobile/CanvasTabBar';
import { CanvasProvider } from '@core/app/contexts/CanvasContext';
import { SelectedElementContextProvider } from '@core/app/contexts/SelectedElementContext';
import { useStorageStore } from '@core/app/stores/storageStore';
import workareaManager from '@core/app/svgedit/workarea';
import ImageTracePanel from '@core/app/views/beambox/ImageTracePanel/ImageTracePanel';
import { LayerPanelContextProvider } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import { ObjectPanelContextProvider } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import DockViewLayout from '@core/app/widgets/dockable/DockViewLayout';
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
    communicator.send('FRONTEND_READY');
    // Init view
    workareaManager.resetView();
    beamboxInit.showStartUpDialogs();

    communicator.on('NEW_APP_MENU', BeamboxGlobalInteraction.attach);

    return () => {
      BeamboxGlobalInteraction.detach();
      communicator.off('NEW_APP_MENU', BeamboxGlobalInteraction.attach);
    };
  }, []);

  const activeLang = useStorageStore((state) => state['active-lang']) ?? 'en';

  const updateContainer = useCallback(() => {
    const leftPanel = document.querySelector('#left-Preview')?.closest('.dv-view');
    const container = document.getElementById('drawer-container');

    if (container && leftPanel) {
      container.style.left = `${(leftPanel.getBoundingClientRect().right || 50) + 1}px`;
    }
  }, []);

  useEffect(() => {
    // TODO: Use subscription
    window.setDrawerXOffset = updateContainer;
  }, [updateContainer]);

  return (
    <CanvasProvider>
      <SelectedElementContextProvider>
        <LayerPanelContextProvider>
          <div className={classNames('studio-container', 'beambox-studio', activeLang, styles.container)}>
            <TopBar />
            <ObjectPanelContextProvider>
              <div className={styles['drawer-container']} id="drawer-container" />
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
              {/* This is a temp place for SvgEditor, will be moved out in */}
              <div id="safe-editor-container" style={{ display: 'none' }}>
                <SvgEditor />
              </div>
            </ObjectPanelContextProvider>
          </div>
          <ImageTracePanel />
        </LayerPanelContextProvider>
      </SelectedElementContextProvider>
    </CanvasProvider>
  );
};

export default Beambox;
