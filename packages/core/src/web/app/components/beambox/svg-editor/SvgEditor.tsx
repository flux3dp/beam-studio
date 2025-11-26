import type { ReactNode } from 'react';
import React, { useState } from 'react';
import { useEffect } from 'react';

import { LeftOutlined } from '@ant-design/icons';
import { ConfigProvider, Drawer } from 'antd';
import classNames from 'classnames';
import { Resizable } from 're-resizable';

import constant from '@core/app/actions/beambox/constant';
import svgEditor from '@core/app/actions/beambox/svg-editor';
import DpiInfo from '@core/app/components/beambox/DpiInfo';
import PathPreview from '@core/app/components/beambox/path-preview/PathPreview';
import PreviewFloatingBar from '@core/app/components/beambox/PreviewFloatingBar';
import ZoomBlock from '@core/app/components/beambox/ZoomBlock';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import workareaManager from '@core/app/svgedit/workarea';
import { importFileInCurrentTab } from '@core/helpers/fileImportHelper';

import Banner from './Banner';
import Chat from './Chat';
import { useChatStore } from './Chat/useChatStore';
import ElementTitle from './ElementTitle';
import Ruler from './Ruler';
import styles from './SvgEditor.module.scss';
import Workarea from './Workarea';

export const SvgEditor = (): ReactNode => {
  const mode = useCanvasStore((state) => state.mode);
  const { isChatShown, setIsChatShown } = useChatStore();
  const [width, setWidth] = useState(400);
  // default motion duration for the drawer
  // this is used to disable the animation when resizing the drawer
  const [motionDurationSlow, setMotionDurationSlow] = useState('0.3s');

  const onClose = () => {
    setIsChatShown(false);
  };

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
            <PreviewFloatingBar />
            <ZoomBlock
              resetView={workareaManager.resetView}
              setZoom={(zoom) => workareaManager.zoom(zoom / constant.dpmm)}
            />
            <DpiInfo />
          </>
        )}

        <ConfigProvider theme={{ token: { motionDurationSlow } }}>
          <Drawer
            closable={false}
            getContainer={false}
            mask={false}
            onClose={onClose}
            open={isChatShown}
            placement="left"
            // use style to override :where
            style={{
              boxShadow: 'none',
            }}
            styles={{
              body: {
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                padding: '0px',
              },
              content: {
                backgroundColor: 'transparent',
              },
              wrapper: { boxShadow: 'none' },
            }}
            width={width}
          >
            <div className={styles.handle} onClick={onClose}>
              <LeftOutlined />
            </div>
            <Resizable
              enable={{ right: true }}
              handleClasses={{ right: styles['resizable-handle'] }}
              maxWidth={638}
              minWidth={360}
              onResize={(_event, _direction, elementRef) => {
                setWidth(elementRef.offsetWidth);
              }}
              onResizeStart={() => setMotionDurationSlow('0s')}
              onResizeStop={() => setMotionDurationSlow('0.3s')}
              size={{ height: '100%', width }}
            >
              <div className={styles['resizable-drawer-content']}>
                <Chat />
              </div>
            </Resizable>
          </Drawer>
        </ConfigProvider>
      </div>
      {mode === CanvasMode.PathPreview && <PathPreview />}
    </>
  );
};

export default SvgEditor;
