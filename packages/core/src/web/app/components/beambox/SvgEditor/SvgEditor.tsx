import type { ReactNode } from 'react';
import React, { memo, useMemo } from 'react';
import { useEffect } from 'react';

import classNames from 'classnames';

import svgEditor from '@core/app/actions/beambox/svg-editor';
import AiGenerate from '@core/app/components/AiGenerate';
import MobileAiGenerate from '@core/app/components/AiGenerate/mobile/MobileAiGenerate';
import PathPreview from '@core/app/components/beambox/PathPreview';
import Chat from '@core/app/components/Chat';
import ElementPanel from '@core/app/components/dialogs/ElementPanel/ElementPanel';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { TimeEstimationButtonContextProvider } from '@core/app/contexts/TimeEstimationButtonContext';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useIsMobile } from '@core/app/stores/screenStore';
import setupTextInputEvents from '@core/app/svgedit/text/setupTextInputEvents';
import ToolBarDrawer from '@core/app/widgets/dockable/ToolBarDrawer';
import { importFileInCurrentTab } from '@core/helpers/fileImportHelper';
import { getOS } from '@core/helpers/getOS';
import { setupSelectAllShortCut } from '@core/helpers/shortcuts';

import Generators from '../../Generators';
import MobileGenerators from '../../Generators/mobile/MobileGenerators';

import Banner from './Banner';
import CanvasControl from './CanvasControl';
import DpiInfo from './DpiInfo';
import ElementTitle from './ElementTitle';
import PreviewFloatingBar from './PreviewFloatingBar';
import Ruler from './Ruler';
import styles from './SvgEditor.module.scss';
import Workarea from './Workarea';
import WorkareaInfo from './WorkareaInfo';

const SvgEditor = (): ReactNode => {
  const isMobile = useIsMobile();
  const { drawerMode, mode } = useCanvasStore();
  const osName = useMemo(() => getOS(), []);

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
          <ElementTitle />
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
            <div className={styles['top-right']}>
              <WorkareaInfo />
            </div>
            {!isMobile && <PreviewFloatingBar />}
            <DpiInfo />
            <div className={styles['bottom-right']}>
              <div className={styles.controls}>
                <TimeEstimationButtonContextProvider>
                  <CanvasControl />
                </TimeEstimationButtonContextProvider>
              </div>
              {isMobile && <PreviewFloatingBar />}
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
