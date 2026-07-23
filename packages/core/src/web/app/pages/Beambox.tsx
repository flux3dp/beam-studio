import React, { useEffect } from 'react';

import { Flex } from 'antd';
import classNames from 'classnames';

import BeamboxGlobalInteraction from '@core/app/actions/beambox/beambox-global-interaction';
import BottomBar from '@core/app/components/beambox/BottomBar';
import RightPanel from '@core/app/components/beambox/RightPanel';
import { ObjectPanelContextProvider } from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelContext';
import SvgEditor from '@core/app/components/beambox/SvgEditor';
import RealSvgEditor from '@core/app/components/beambox/SvgEditor/RealSvgEditor';
import TopBar from '@core/app/components/beambox/TopBar';
import ImageTracePanel from '@core/app/components/dialogs/ImageTracePanel/ImageTracePanel';
import { initTemplatePreviewReceiver } from '@core/app/components/dialogs/templatePreview/templatePreviewReceiver';
import { MenuEvents, MiscEvents } from '@core/app/constants/ipcEvents';
import { CanvasProvider } from '@core/app/contexts/CanvasContext';
import { getIsTemplatePreview, templateModes, useWithinInteractionModes } from '@core/app/stores/interactionModeStore';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import createNewText from '@core/app/svgedit/text/createNewText';
import { createNewFitText } from '@core/app/svgedit/text/fitText';
import workareaManager from '@core/app/svgedit/workarea';
import DockViewLayout from '@core/app/widgets/dockable/DockViewLayout';
import ToolBarDrawerContainer from '@core/app/widgets/dockable/ToolBarDrawerContainer';
import beamFileHelper from '@core/helpers/beam-file-helper';
import { hashMap } from '@core/helpers/hashHelper';
import { isRetailDev } from '@core/helpers/is-dev';
import sentryHelper from '@core/helpers/sentry-helper';
import BeamboxInit from '@core/implementations/beamboxInit';
import communicator from '@core/implementations/communicator';

import styles from './Beambox.module.scss';

import 'react-resizable/css/styles.css';

sentryHelper.initSentry();

const beamboxInit = new BeamboxInit();

const Beambox = (): React.JSX.Element => {
  const isTablet = useIsTabletOrMobile();
  const isWithinTemplateModes = useWithinInteractionModes(templateModes);

  useEffect(() => {
    if (isWithinTemplateModes) {
      document.body.classList.add('template');
    } else {
      document.body.classList.remove('template');
    }

    return () => {
      document.body.classList.remove('template');
    };
  }, [isWithinTemplateModes]);

  useEffect(() => {
    window.homePage = hashMap.editor;
    communicator.send(MiscEvents.FrontendReady);
    // Init view
    workareaManager.resetView();
    beamboxInit.showStartUpDialogs();

    communicator.on(MenuEvents.NewAppMenu, BeamboxGlobalInteraction.attach);

    const detachTemplatePreview = getIsTemplatePreview() ? initTemplatePreviewReceiver() : undefined;

    if (isRetailDev()) {
      setTimeout(async () => {
        try {
          const blob = await fetch('assets/elem-types.beam').then((res) => res.blob());

          console.log('Loaded elem-types.beam:', blob);

          const file = new File([blob], 'elem-types.beam', { type: 'text/plain' });

          file.path = 'assets/elem-types.beam';
          beamFileHelper.readBeam(file);
        } catch (e) {
          console.error('Failed to load elem-types.beam', e);
          createNewText(200, 200, { addToHistory: true, isToSelect: true, text: 'Text' });
          createNewFitText(100, 100, { addToHistory: true, isToSelect: true, text: 'Text' });
        }
      }, 2000);
    }

    return () => {
      BeamboxGlobalInteraction.detach();
      communicator.off(MenuEvents.NewAppMenu, BeamboxGlobalInteraction.attach);
      detachTemplatePreview?.();
    };
  }, []);

  const activeLang = useStorageStore((state) => state['active-lang']) ?? 'en';

  return (
    <CanvasProvider>
      <div className={classNames('studio-container', 'beambox-studio', activeLang, styles.container)}>
        <TopBar />
        <ObjectPanelContextProvider>
          <ToolBarDrawerContainer />
          {isTablet || isWithinTemplateModes ? (
            <>
              <RealSvgEditor />
              <RightPanel />
              <BottomBar />
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
    </CanvasProvider>
  );
};

export default Beambox;
