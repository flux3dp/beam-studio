import type { ReactNode } from 'react';
import React from 'react';
import { useEffect } from 'react';

import classNames from 'classnames';

import constant from '@core/app/actions/beambox/constant';
import svgEditor from '@core/app/actions/beambox/svg-editor';
import PathPreview from '@core/app/components/beambox/path-preview/PathPreview';
import ZoomBlock from '@core/app/components/common/ZoomBlock';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { TimeEstimationButtonContextProvider } from '@core/app/contexts/TimeEstimationButtonContext';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import workareaManager from '@core/app/svgedit/workarea';
import Drawer from '@core/app/widgets/Drawer';
import { importFileInCurrentTab } from '@core/helpers/fileImportHelper';
import { useIsMobile } from '@core/helpers/system-helper';

import AiGenerate from './AiGenerate';
import { useAiGenerateStore } from './AiGenerate/useAiGenerateStore';
import Banner from './Banner';
import Chat from './Chat';
import { useChatStore } from './Chat/useChatStore';
import DpiInfo from './DpiInfo';
import ElementTitle from './ElementTitle';
import PreviewFloatingBar from './PreviewFloatingBar';
import PreviewSlider from './PreviewSlider';
import Ruler from './Ruler';
import styles from './SvgEditor.module.scss';
import TimeEstimationButton from './TimeEstimationButton';
import Workarea from './Workarea';

export const SvgEditor = (): ReactNode => {
  const isMobile = useIsMobile();
  const mode = useCanvasStore((state) => state.mode);
  const { isAiGenerateShown, setState } = useAiGenerateStore();
  const { isChatShown, setIsChatShown } = useChatStore();

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
    <>
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
            className={classNames(styles.workarea, { mac: window.os === 'MacOS', [styles.mac]: window.os === 'MacOS' })}
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

        <Drawer
          enable={false}
          isOpen={isAiGenerateShown}
          setIsOpen={(isOpen) => setState({ isAiGenerateShown: isOpen })}
        >
          <AiGenerate />
        </Drawer>

        <Drawer enable={{ right: true }} isOpen={isChatShown} setIsOpen={setIsChatShown}>
          <Chat />
        </Drawer>
      </div>
      {mode === CanvasMode.PathPreview && <PathPreview />}
    </>
  );
};

export default SvgEditor;
