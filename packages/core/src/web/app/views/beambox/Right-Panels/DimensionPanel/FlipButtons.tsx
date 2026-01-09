import React, { memo } from 'react';

import { Button } from 'antd';

import DimensionPanelIcons from '@core/app/icons/dimension-panel/DimensionPanelIcons';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './FlipButtons.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const FlipButtons = (): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.object_panel;
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <ObjectPanelItem.ActionList
        actions={[
          {
            icon: <DimensionPanelIcons.HFlip />,
            label: t.hflip,
            onClick: () => svgCanvas.flipSelectedElements(-1, 1),
          },
          {
            icon: <DimensionPanelIcons.VFlip />,
            label: t.vflip,
            onClick: () => svgCanvas.flipSelectedElements(1, -1),
          },
        ]}
        content={<DimensionPanelIcons.HFlip />}
        id="flip"
        label={t.flip}
      />
    );
  }

  return (
    <div className={styles.container} data-tutorial="object-flip-buttons">
      <Button
        icon={<DimensionPanelIcons.HFlip />}
        id="horizontal_flip"
        onClick={() => svgCanvas.flipSelectedElements(-1, 1)}
        title={t.hflip}
        type="text"
      />
      <Button
        icon={<DimensionPanelIcons.VFlip />}
        id="vertical_flip"
        onClick={() => svgCanvas.flipSelectedElements(1, -1)}
        title={t.vflip}
        type="text"
      />
    </div>
  );
};

export default memo(FlipButtons);
