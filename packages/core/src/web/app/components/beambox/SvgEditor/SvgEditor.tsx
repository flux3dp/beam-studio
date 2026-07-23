import type { ReactNode } from 'react';
import React, { memo, useMemo } from 'react';
import { useEffect } from 'react';

import { EyeOutlined, LockOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import svgEditor from '@core/app/actions/beambox/svg-editor';
import AiGenerate from '@core/app/components/AiGenerate';
import MobileAiGenerate from '@core/app/components/AiGenerate/mobile/MobileAiGenerate';
import PathPreview from '@core/app/components/beambox/PathPreview';
import AddElementButton from '@core/app/components/beambox/SvgEditor/AddElementButton';
import FloatingButton from '@core/app/components/beambox/SvgEditor/FloatingButton';
import LayerPanelButton from '@core/app/components/beambox/SvgEditor/LayerPanelButton';
import Chat from '@core/app/components/Chat';
import ElementPanel from '@core/app/components/dialogs/ElementPanel/ElementPanel';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { TimeEstimationButtonContextProvider } from '@core/app/contexts/TimeEstimationButtonContext';
import { TopBarHintsContextProvider } from '@core/app/contexts/TopBarHintsContext';
import TopBarIcons from '@core/app/icons/top-bar/TopBarIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import {
  setTemplateMode,
  templateModes,
  useIsInteractionMode,
  useWithinInteractionModes,
} from '@core/app/stores/interactionModeStore';
import { useIsMobile, useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import historyUtils from '@core/app/svgedit/history/utils';
import { resetTemplate } from '@core/app/svgedit/resetTemplate';
import setupTextInputEvents from '@core/app/svgedit/text/setupTextInputEvents';
import ToolBarDrawer from '@core/app/widgets/dockable/ToolBarDrawer';
import { importFileInCurrentTab } from '@core/helpers/fileImportHelper';
import { getOS } from '@core/helpers/getOS';
import { isRetailDev } from '@core/helpers/is-dev';
import { setupSelectAllShortCut } from '@core/helpers/shortcuts';

import { showTemplateModePreview } from '../../dialogs/templatePreview/previewTemplateMode';
import Generators from '../../Generators';
import MobileGenerators from '../../Generators/mobile/MobileGenerators';
import TopBarHints from '../TopBar/TopBarHints';

import Banner from './Banner';
import CanvasControl from './CanvasControl';
import DpiInfo from './DpiInfo';
import ElementTitle from './ElementTitle';
import PreviewController from './PreviewController';
import PreviewFloatingBar from './PreviewFloatingBar';
import Ruler from './Ruler';
import styles from './SvgEditor.module.scss';
import Workarea from './Workarea';

const SvgEditor = (): ReactNode => {
  const isMobile = useIsMobile();
  const isTablet = useIsTabletOrMobile();
  const { drawerMode, mode } = useCanvasStore();
  const osName = useMemo(() => getOS(), []);
  const isProjectMode = useIsInteractionMode('project');
  const isExploreMode = useIsInteractionMode('explore');
  const isWithinTemplateModes = useWithinInteractionModes(templateModes);

  useEffect(() => {
    if (window.$) {
      $(svgEditor.init);
      setupTextInputEvents();
      setupSelectAllShortCut();

      if (window.importingFile) {
        importFileInCurrentTab(window.importingFile);
        window.importingFile = undefined;
      }
    } else {
      console.warn('jQuery ($) is not available for svgEditor.init');
    }
  }, []);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <div
        className={styles.container}
        id="svg_editor"
        style={mode === CanvasMode.PathPreview ? { maxWidth: 0, visibility: 'hidden' } : {}}
      >
        <Banner />
        <div className={styles['workarea-container']} id="workarea-container">
          <Ruler />
          <Workarea
            className={classNames(styles.workarea, { mac: osName === 'MacOS', [styles.mac]: osName === 'MacOS' })}
          />
        </div>
        <div className={styles['invisible-tools']}>
          <div id="tool_import" style={{ display: 'none' }} />
          <input id="text" size={32} type="text" />
        </div>

        {mode !== CanvasMode.PathPreview && (
          <>
            {!isTablet && !isExploreMode && <PreviewFloatingBar />}
            <div className={styles.top}>
              <div className={styles.left}>
                {isTablet && !isExploreMode && <PreviewController />}
                <div id="svg-nest-buttons-container">{/* SvgNestButtons and its mask will be rendered here */}</div>
                <div>
                  <ElementTitle />
                  <TopBarHintsContextProvider>
                    <TopBarHints />
                  </TopBarHintsContextProvider>
                </div>
              </div>
              <div className={styles.right}>
                {isTablet && (
                  <div className={styles.buttons}>
                    <FloatingButton
                      icon={<TopBarIcons.Undo />}
                      onClick={() => historyUtils.undo({ checkShortCutsScope: false })}
                    />
                    <FloatingButton
                      icon={<TopBarIcons.Redo />}
                      onClick={() => historyUtils.redo({ checkShortCutsScope: false })}
                    />
                    {isWithinTemplateModes ? (
                      <FloatingButton icon={<TopBarIcons.Reset />} onClick={resetTemplate} />
                    ) : (
                      <LayerPanelButton />
                    )}
                  </div>
                )}
                {isProjectMode && (
                  <div>
                    <FloatingButton icon={<EyeOutlined />} onClick={() => showTemplateModePreview()} />
                  </div>
                )}
                {isRetailDev() && (
                  <div>
                    <FloatingButton
                      active={isWithinTemplateModes}
                      icon={<LockOutlined />}
                      onClick={() => setTemplateMode(!isWithinTemplateModes)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={styles.bottom}>
              <div className={styles.left}>
                <DpiInfo />
              </div>
              <div className={styles.right}>
                {isTablet && !isWithinTemplateModes && <AddElementButton />}
                <TimeEstimationButtonContextProvider>
                  <CanvasControl />
                </TimeEstimationButtonContextProvider>
              </div>
            </div>
          </>
        )}

        {isMobile ? (
          drawerMode === 'ai-generate' && <MobileAiGenerate />
        ) : (
          <ToolBarDrawer enableResizable={false} mode="ai-generate">
            <AiGenerate />
          </ToolBarDrawer>
        )}
        {isMobile ? (
          drawerMode === 'generator' && <MobileGenerators />
        ) : (
          <ToolBarDrawer enableResizable={false} mode="generator">
            <Generators />
          </ToolBarDrawer>
        )}
        <ToolBarDrawer enableResizable={{ right: true }} mode="ai-chat">
          <Chat />
        </ToolBarDrawer>
        <ElementPanel />
      </div>
      {mode === CanvasMode.PathPreview && <PathPreview />}
    </div>
  );
};

export default memo(SvgEditor);
