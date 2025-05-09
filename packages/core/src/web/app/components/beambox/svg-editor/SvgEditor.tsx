import type { ReactNode } from 'react';
import React, { useState } from 'react';
import { useContext, useEffect } from 'react';

import { ConfigProvider, Drawer } from 'antd';
import classNames from 'classnames';
import { Resizable } from 're-resizable';

import constant from '@core/app/actions/beambox/constant';
import svgEditor from '@core/app/actions/beambox/svg-editor';
import DpiInfo from '@core/app/components/beambox/DpiInfo';
import PathPreview from '@core/app/components/beambox/path-preview/PathPreview';
import ZoomBlock from '@core/app/components/beambox/ZoomBlock';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import workareaManager from '@core/app/svgedit/workarea';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import Banner from './Banner';
import Chat from './Chat';
import ElementTitle from './ElementTitle';
import Ruler from './Ruler';
import styles from './SvgEditor.module.scss';
import Workarea from './Workarea';

const beamyEventEmitter = eventEmitterFactory.createEventEmitter('beamy');

export const SvgEditor = (): ReactNode => {
  const { mode } = useContext(CanvasContext);
  const [isBeamyShown, setIsBeamyShown] = useState(false);
  const [width, setWidth] = useState(400);
  // default motion duration for the drawer
  // this is used to disable the animation when resizing the drawer
  const [motionDurationSlow, setMotionDurationSlow] = useState('0.3s');

  const onClose = () => {
    setIsBeamyShown(false);
  };

  useEffect(() => {
    const showBeamyHandler = (showState: boolean | undefined) => {
      setIsBeamyShown(typeof showState === 'boolean' ? showState : true);
    };

    beamyEventEmitter.on('SHOW_BEAMY', showBeamyHandler);

    return () => {
      beamyEventEmitter.off('SHOW_BEAMY', showBeamyHandler);
    };
  }, []);

  useEffect(() => {
    if (window.$) {
      $(svgEditor.init);
    } else {
      console.warn('jQuery ($) is not available for svgEditor.init');
    }
  }, []);

  return (
    <>
      <div
        className={styles.container}
        id="svg_editor"
        style={mode === CanvasMode.PathPreview ? { display: 'none' } : {}}
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
            open={isBeamyShown}
            placement="left"
            // use style to override :where
            style={{
              backgroundColor: 'transparent',
              borderRadius: '1rem',
              boxShadow: 'none',
            }}
            styles={{
              body: {
                borderRadius: '1rem',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                padding: '0px',
              },
              wrapper: { boxShadow: 'none' },
            }}
            width={width}
          >
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
