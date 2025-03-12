import type { ReactNode } from 'react';
import React from 'react';
import { useContext, useEffect } from 'react';

import classNames from 'classnames';

import constant from '@core/app/actions/beambox/constant';
import svgEditor from '@core/app/actions/beambox/svg-editor';
import DpiInfo from '@core/app/components/beambox/DpiInfo';
import PathPreview from '@core/app/components/beambox/path-preview/PathPreview';
import ZoomBlock from '@core/app/components/beambox/ZoomBlock';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import workareaManager from '@core/app/svgedit/workarea';

import Banner from './Banner';
import ElementTitle from './ElementTitle';
import Ruler from './Ruler';
import styles from './SvgEditor.module.scss';
import Workarea from './Workarea';

export const SvgEditor = (): ReactNode => {
  const { mode } = useContext(CanvasContext);

  useEffect(() => {
    const { $ } = window;

    $(svgEditor.init);
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
            className={classNames(styles.workarea, {
              mac: window.os === 'MacOS',
              [styles.mac]: window.os === 'MacOS',
            })}
          />
        </div>
        <div id="tool_import" style={{ display: 'none' }} />
        <input id="text" size={35} type="text" />
        <div id="cur_context_panel" />
        <div className="dropdown" id="option_lists" />
      </div>
      {mode === CanvasMode.PathPreview && <PathPreview />}
      {mode !== CanvasMode.PathPreview && (
        <>
          <ZoomBlock
            resetView={workareaManager.resetView}
            setZoom={(zoom) => workareaManager.zoom(zoom / constant.dpmm)}
          />
          <DpiInfo />
        </>
      )}
    </>
  );
};

export default SvgEditor;
