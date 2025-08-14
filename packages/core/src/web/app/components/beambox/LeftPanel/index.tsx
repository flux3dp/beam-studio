import React, { memo, useContext, useEffect, useRef } from 'react';

import { match } from 'ts-pattern';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import CurveEngravingTool from '@core/app/components/beambox/LeftPanel/components/CurveEngravingTool';
import DrawingToolButtonGroup from '@core/app/components/beambox/LeftPanel/components/DrawingToolButtonGroup';
import LeftPanelButton from '@core/app/components/beambox/LeftPanel/components/LeftPanelButton';
import PreviewToolButtonGroup from '@core/app/components/beambox/LeftPanel/components/PreviewToolButtonGroup';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';

const UnmemorizedLeftPanel = () => {
  const { mode, toggleAutoFocus, togglePathPreview } = useContext(CanvasContext);
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

  return match(mode)
    .with(CanvasMode.Draw, () => <DrawingToolButtonGroup className={styles.container} />)
    .with(CanvasMode.CurveEngraving, () => <CurveEngravingTool className={styles.container} />)
    .with(CanvasMode.PathPreview, () => (
      <div className={styles.container}>
        <LeftPanelButton
          icon={<LeftPanelIcons.Back />}
          id="Exit-Preview"
          onClick={togglePathPreview}
          title={left_panel.label.end_preview}
        />
      </div>
    ))
    .with(CanvasMode.AutoFocus, () => (
      <div className={styles.container}>
        <LeftPanelButton
          icon={<LeftPanelIcons.Back />}
          id="Exit-Preview"
          onClick={toggleAutoFocus}
          title={left_panel.label.end_preview}
        />
      </div>
    ))
    .otherwise(() => <PreviewToolButtonGroup className={styles.container} />);
};

const LeftPanel = memo(UnmemorizedLeftPanel);

export default LeftPanel;
