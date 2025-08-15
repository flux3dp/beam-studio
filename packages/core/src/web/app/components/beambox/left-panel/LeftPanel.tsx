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

const LeftPanel = memo(() => {
  const { mode, togglePathPreview } = useContext(CanvasContext);
  const modeRef = useRef(mode);
  const {
    beambox: { left_panel: t },
  } = useI18n();

  useEffect(() => {
    const checkMode = (targetMode: CanvasMode = CanvasMode.Draw) => modeRef.current === targetMode;
    const unsubscribes: Array<() => void> = [
      shortcuts.on(['v'], () => {
        // eslint-disable-next-line hooks/rules-of-hooks
        if (checkMode()) FnWrapper.useSelectTool();
      }),
      shortcuts.on(['i'], () => {
        if (checkMode()) FnWrapper.importImage();
      }),
      shortcuts.on(['t'], () => {
        if (checkMode()) FnWrapper.insertText();
      }),
      shortcuts.on(['m'], () => {
        if (checkMode(CanvasMode.Draw)) FnWrapper.insertRectangle();
      }),
      shortcuts.on(['c'], () => {
        if (checkMode(CanvasMode.Draw)) FnWrapper.insertEllipse();
      }),
      shortcuts.on(['\\'], () => {
        if (checkMode(CanvasMode.Draw)) FnWrapper.insertLine();
      }),
      shortcuts.on(['p'], () => {
        if (checkMode(CanvasMode.Draw)) FnWrapper.insertPath();
      }),
      shortcuts.on(['e'], () => {
        if (checkMode(CanvasMode.Draw)) $('#left-Element').trigger('click');
      }),
    ];

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, []);

  useEffect(() => {
    modeRef.current = mode;
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
          title={t.label.end_preview}
        />
      </div>
    );
  }

  if (mode === CanvasMode.CurveEngraving) {
    return <CurveEngravingTool className={styles.container} />;
  }

  return <PreviewToolButtonGroup className={styles.container} />;
});

export default LeftPanel;
