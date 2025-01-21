import React, { memo } from 'react';
import { Button } from 'antd';

import DimensionPanelIcons from '@core/app/icons/dimension-panel/DimensionPanelIcons';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import useI18n from '@core/helpers/useI18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './FlipButtons.module.scss';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const FlipButtons = (): JSX.Element => {
  const t = useI18n().beambox.right_panel.object_panel;
  const isMobile = useIsMobile();

  if (isMobile)
    return (
      <ObjectPanelItem.ActionList
        id="flip"
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
        label={t.flip}
      />
    );
  return (
    <div className={styles.container}>
      <Button
        id="horizontal_flip"
        type="text"
        icon={<DimensionPanelIcons.HFlip />}
        onClick={() => svgCanvas.flipSelectedElements(-1, 1)}
        title={t.hflip}
      />
      <Button
        id="vertical_flip"
        type="text"
        icon={<DimensionPanelIcons.VFlip />}
        onClick={() => svgCanvas.flipSelectedElements(1, -1)}
        title={t.vflip}
      />
    </div>
  );
};

export default memo(FlipButtons);
