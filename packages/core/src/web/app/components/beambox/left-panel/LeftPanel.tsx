import React from 'react';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import CurveEngravingTool from '@core/app/components/beambox/left-panel/CurveEngravingTool';
import DrawingToolButtonGroup from '@core/app/components/beambox/left-panel/DrawingToolButtonGroup';
import LeftPanelButton from '@core/app/components/beambox/left-panel/LeftPanelButton';
import PreviewToolButtonGroup from '@core/app/components/beambox/left-panel/PreviewToolButtonGroup';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import i18n from '@core/helpers/i18n';
import shortcuts from '@core/helpers/shortcuts';

import styles from './LeftPanel.module.scss';

const LANG = i18n.lang.beambox.left_panel;

class LeftPanel extends React.PureComponent {
  declare context: React.ContextType<typeof CanvasContext>;

  componentDidMount(): void {
    // Selection Management
    // TODO: move to layer panel
    $('#layerpanel').mouseup(() => {
      FnWrapper.clearSelection();
    });

    shortcuts.on(['v'], () => {
      const { mode } = this.context;

      if (mode === CanvasMode.Draw) {
        FnWrapper.useSelectTool();
      }
    });

    shortcuts.on(['i'], () => {
      const { mode } = this.context;

      if (mode === CanvasMode.Draw) {
        FnWrapper.importImage();
      }
    });

    shortcuts.on(['t'], () => {
      const { mode } = this.context;

      if (mode === CanvasMode.Draw) {
        FnWrapper.insertText();
      }
    });

    shortcuts.on(['m'], () => {
      const { mode } = this.context;

      if (mode === CanvasMode.Draw) {
        FnWrapper.insertRectangle();
      }
    });

    shortcuts.on(['c'], () => {
      const { mode } = this.context;

      if (mode === CanvasMode.Draw) {
        FnWrapper.insertEllipse();
      }
    });

    shortcuts.on(['\\'], () => {
      const { mode } = this.context;

      if (mode === CanvasMode.Draw) {
        FnWrapper.insertLine();
      }
    });

    shortcuts.on(['p'], () => {
      const { mode } = this.context;

      if (mode === CanvasMode.Draw) {
        FnWrapper.insertPath();
      }
    });

    shortcuts.on(['e'], () => {
      const { mode } = this.context;

      if (mode === CanvasMode.Draw) {
        $('#left-Element').trigger('click');
      }
    });
  }

  componentWillUnmount(): void {
    $('#svg_editor').removeClass('color');
  }

  render(): React.JSX.Element {
    const { mode, togglePathPreview } = this.context;

    if (mode === CanvasMode.Draw) {
      return <DrawingToolButtonGroup className={styles.container} />;
    }

    if (mode === CanvasMode.PathPreview) {
      return (
        <div className={styles.container}>
          <LeftPanelButton
            icon={<LeftPanelIcons.Back />}
            id="Exit-Preview"
            onClick={togglePathPreview}
            title={LANG.label.end_preview}
          />
        </div>
      );
    }

    if (mode === CanvasMode.CurveEngraving) {
      return <CurveEngravingTool className={styles.container} />;
    }

    return <PreviewToolButtonGroup className={styles.container} />;
  }
}

LeftPanel.contextType = CanvasContext;

export default LeftPanel;
