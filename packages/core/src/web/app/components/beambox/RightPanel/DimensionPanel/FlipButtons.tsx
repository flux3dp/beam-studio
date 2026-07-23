import React, { memo } from 'react';

import { Button } from 'antd';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import DimensionPanelIcons from '@core/app/icons/dimension-panel/DimensionPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { ControlType } from '@core/helpers/element/editable/base';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './FlipButtons.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const FlipButtons = (): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.object_panel;
  const isTablet = useIsTabletOrMobile();

  return (
    <ControlBlock className={styles['full-row']} label={t.flip} type={ControlType._FLIP}>
      <div className={styles.container}>
        <Button
          className={styles.btn}
          icon={<DimensionPanelIcons.HFlip />}
          id="horizontal_flip"
          onClick={() => svgCanvas.flipSelectedElements(-1, 1)}
          title={t.hflip}
        >
          {isTablet && t.hflip}
        </Button>
        <Button
          className={styles.btn}
          icon={<DimensionPanelIcons.VFlip />}
          id="vertical_flip"
          onClick={() => svgCanvas.flipSelectedElements(1, -1)}
          title={t.vflip}
        >
          {isTablet && t.vflip}
        </Button>
      </div>
    </ControlBlock>
  );
};

export default memo(FlipButtons);
