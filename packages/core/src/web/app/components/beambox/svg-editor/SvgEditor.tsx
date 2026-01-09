import type { ReactNode } from 'react';
import React, { memo, useMemo } from 'react';
import { useEffect } from 'react';

import classNames from 'classnames';

import constant from '@core/app/actions/beambox/constant';
import svgEditor from '@core/app/actions/beambox/svg-editor';
import AiGenerate from '@core/app/components/AiGenerate';
import MobileAiGenerate from '@core/app/components/AiGenerate/mobile/MobileAiGenerate';
import PathPreview from '@core/app/components/beambox/path-preview/PathPreview';
import Chat from '@core/app/components/Chat';
import ZoomBlock from '@core/app/components/common/ZoomBlock';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { TimeEstimationButtonContextProvider } from '@core/app/contexts/TimeEstimationButtonContext';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import workareaManager from '@core/app/svgedit/workarea';
import ElementPanel from '@core/app/views/beambox/ElementPanel/ElementPanel';
import { setGroupVisible } from '@core/app/widgets/dockable/utils';
import ToolBarDrawer from '@core/app/widgets/ToolBarDrawer';
import { importFileInCurrentTab } from '@core/helpers/fileImportHelper';
import { getOS } from '@core/helpers/getOS';
import { useIsMobile } from '@core/helpers/system-helper';

import Banner from './Banner';
import DpiInfo from './DpiInfo';
import ElementTitle from './ElementTitle';
import PreviewFloatingBar from './PreviewFloatingBar';
import PreviewSlider from './PreviewSlider';
import Ruler from './Ruler';
import styles from './SvgEditor.module.scss';
import TimeEstimationButton from './TimeEstimationButton';
import Workarea from './Workarea';

const SvgEditor = (): ReactNode => {
  const isMobile = useIsMobile();
  const { drawerMode, mode } = useCanvasStore();
  const osName = useMemo(() => getOS(), []);
  const isPathPreviewMode = useMemo(() => mode === CanvasMode.PathPreview, [mode]);

  useEffect(() => {
    if (isMobile) return;

    setGroupVisible(!isPathPreviewMode, ['groupTools', 'groupCanvas']);
  }, [isMobile, isPathPreviewMode]);

  useEffect(() => {
    if (window.$) {
      $(svgEditor.init);

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
          <div id="cur_context_panel" />
          <div className="dropdown" id="option_lists" />
        </div>

        {mode !== CanvasMode.PathPreview && (
          <>
            {!isMobile && <PreviewFloatingBar />}
            <ZoomBlock
              resetView={workareaManager.resetView}
              setZoom={(zoom) => workareaManager.zoom(zoom / constant.dpmm)}
            />
            <DpiInfo />
            <div className={styles['bottom-right']}>
              <div className={styles.controls}>
                <TimeEstimationButtonContextProvider>
                  <TimeEstimationButton />
                </TimeEstimationButtonContextProvider>
                <PreviewSlider />
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
