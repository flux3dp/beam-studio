import React, { memo, useContext, useEffect } from 'react';

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

const UnmemorizedLeftPanel = () => {
  const { mode, togglePathPreview } = useContext(CanvasContext);

  useEffect(() => {
    const handleMouseUp = () => FnWrapper.clearSelection();

    $('#layerpanel').on('mouseup', handleMouseUp);

    const shortcutsMap = {
      '\\': FnWrapper.insertLine,
      c: FnWrapper.insertEllipse,
      e: () => $('#left-Element').trigger('click'),
      i: FnWrapper.importImage,
      m: FnWrapper.insertRectangle,
      p: FnWrapper.insertPath,
      t: FnWrapper.insertText,
      v: FnWrapper.useSelectTool,
    };

    const registeredHandlers: Record<string, () => void> = {};

    Object.entries(shortcutsMap).forEach(([key, callback]) => {
      const handler = () => {
        if (mode === CanvasMode.Draw) {
          callback();
        }
      };

      registeredHandlers[key] = handler;
      shortcuts.on([key], handler);
    });

    return () => {
      $('#layerpanel').off('mouseup', handleMouseUp);
      Object.entries(registeredHandlers).forEach(([key]) => {
        shortcuts.off([key]);
      });
    };
  }, [mode]);

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
};

const LeftPanel = memo(UnmemorizedLeftPanel);

export default LeftPanel;
