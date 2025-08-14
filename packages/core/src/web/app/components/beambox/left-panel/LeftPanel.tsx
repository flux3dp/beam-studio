import React, { memo, useContext, useEffect, useRef } from 'react';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import CurveEngravingTool from '@core/app/components/beambox/left-panel/CurveEngravingTool';
import DrawingToolButtonGroup from '@core/app/components/beambox/left-panel/DrawingToolButtonGroup';
import LeftPanelButton from '@core/app/components/beambox/left-panel/LeftPanelButton';
import PreviewToolButtonGroup from '@core/app/components/beambox/left-panel/PreviewToolButtonGroup';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';

import styles from './LeftPanel.module.scss';

const UnmemorizedLeftPanel = () => {
  const { mode, togglePathPreview } = useContext(CanvasContext);
  const modeRef = useRef(mode);
  const {
    beambox: { left_panel },
  } = useI18n();

  useEffect(() => {
    const checkMode = (targetMode: CanvasMode = CanvasMode.Draw) => modeRef.current === targetMode;
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
    const unsubscribes = Array.of<() => void>();

    Object.entries(shortcutsMap).forEach(([key, callback]) => {
      const handler = () => {
        if (checkMode()) callback();
      };

      unsubscribes.push(shortcuts.on([key], handler));
    });

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
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
          title={left_panel.label.end_preview}
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
