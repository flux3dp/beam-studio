import React from 'react';
import classNames from 'classnames';

import constant from 'app/actions/beambox/constant';
import DpiInfo from 'app/components/beambox/DpiInfo';
import PathPreview from 'app/components/beambox/path-preview/PathPreview';
import Ruler from 'app/components/beambox/svg-editor/Ruler';
import svgEditor from 'app/actions/beambox/svg-editor';
import Workarea from 'app/components/beambox/svg-editor/Workarea';
import workareaManager from 'app/svgedit/workarea';
import ZoomBlock from 'app/components/beambox/ZoomBlock';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { CanvasMode } from 'app/constants/canvasMode';

import styles from './SvgEditor.module.scss';

export default class SvgEditor extends React.Component {
  // eslint-disable-next-line react/static-property-placement
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
        id="svg_editor"
        className={platformClassNames}
        style={mode === CanvasMode.PathPreview ? { display: 'none' } : {}}
      >
        <div>
          <Ruler />
          <Workarea className={platformClassNames} />
          <div id="tool_import" style={{ display: 'none' }} />
          <input id="text" type="text" size={35} />
          <div id="cur_context_panel" />
          <div id="option_lists" className="dropdown" />
        </div>
      </div>
    );
  };

  render(): JSX.Element {
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
              setZoom={(zoom) => workareaManager.zoom(zoom / constant.dpmm)}
              resetView={workareaManager.resetView}
            />
            <DpiInfo />
          </>
        )}
      </>
    );
  }
}

SvgEditor.contextType = CanvasContext;
