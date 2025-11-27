import React, { memo, useEffect } from 'react';

import { pick } from 'remeda';
import { match } from 'ts-pattern';
import { useShallow } from 'zustand/shallow';

import CurveEngravingTool from '@core/app/components/beambox/LeftPanel/components/CurveEngravingTool';
import DrawingToolButtonGroup from '@core/app/components/beambox/LeftPanel/components/DrawingToolButtonGroup';
import LeftPanelButton from '@core/app/components/beambox/LeftPanel/components/LeftPanelButton';
import { CanvasMode } from '@core/app/constants/canvasMode';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { toggleAutoFocus } from '@core/app/stores/canvas/utils/autoFocus';
import { registerCanvasShortcuts } from '@core/app/stores/canvas/utils/registerCanvasEventsAndShortcuts';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';

const UnmemorizedLeftPanel = () => {
  const { mode, togglePathPreview } = useCanvasStore(useShallow((state) => pick(state, ['mode', 'togglePathPreview'])));
  const {
    beambox: { left_panel },
  } = useI18n();

  useEffect(() => registerCanvasShortcuts(), []);

  return match(mode)
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
          onClick={async () => {
            await toggleAutoFocus(false);
          }}
          title={left_panel.label.end_preview}
        />
      </div>
    ))
    .otherwise(() => <DrawingToolButtonGroup className={styles.container} />);
};

const LeftPanel = memo(UnmemorizedLeftPanel);

export default LeftPanel;
