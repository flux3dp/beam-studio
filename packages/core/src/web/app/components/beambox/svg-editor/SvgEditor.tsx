import React from 'react';

import classNames from 'classnames';

import constant from '@core/app/actions/beambox/constant';
import svgEditor from '@core/app/actions/beambox/svg-editor';
import DpiInfo from '@core/app/components/beambox/DpiInfo';
import PathPreview from '@core/app/components/beambox/path-preview/PathPreview';
import Ruler from '@core/app/components/beambox/svg-editor/Ruler';
import Workarea from '@core/app/components/beambox/svg-editor/Workarea';
import ZoomBlock from '@core/app/components/beambox/ZoomBlock';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import workareaManager from '@core/app/svgedit/workarea';

import styles from './SvgEditor.module.scss';

export default class SvgEditor extends React.Component {
  declare context: React.ContextType<typeof CanvasContext>;

  componentDidMount(): void {
    const { $ } = window;

    $(svgEditor.init);
  }

  private renderSvgEditor = () => {
    const { mode } = this.context;
    const platformClassNames = classNames({
      mac: window.os === 'MacOS',
      [styles.mac]: window.os === 'MacOS',
    });

    return (
      <div
        className={platformClassNames}
        id="svg_editor"
        style={mode === CanvasMode.PathPreview ? { display: 'none' } : {}}
      >
        <div>
          <Ruler />
          <Workarea className={platformClassNames} />
          <div id="tool_import" style={{ display: 'none' }} />
          <input id="text" size={35} type="text" />
          <div id="cur_context_panel" />
          <div className="dropdown" id="option_lists" />
        </div>
      </div>
    );
  };

  render(): React.JSX.Element {
    const { mode } = this.context;

    // HIDE ALMOST ALL TOOLS USING CSS
    return (
      <>
        <div>
          {this.renderSvgEditor()}
          <div id="dialog_box">
            <div className="overlay" />
            <div id="dialog_container">
              <div id="dialog_content" />
              <div id="dialog_buttons" />
            </div>
          </div>
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
  }
}

SvgEditor.contextType = CanvasContext;
