import React, { memo } from 'react';

import { Button } from 'antd';

import DimensionPanelIcons from '@core/app/icons/dimension-panel/DimensionPanelIcons';
import { useIsMobile } from '@core/app/stores/screenStore';
import { flipSelectedElements } from '@core/app/svgedit/operations/flip';
import useI18n from '@core/helpers/useI18n';

import ObjectPanelItem from '../ObjectPanelItem';

import styles from './FlipButtons.module.scss';

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
            onClick: () => flipSelectedElements(-1, 1),
          },
          {
            icon: <DimensionPanelIcons.VFlip />,
            label: t.vflip,
            onClick: () => flipSelectedElements(1, -1),
          },
        ]}
        content={<DimensionPanelIcons.HFlip />}
        id="flip"
        label={t.flip}
      />
    );
  }

  return (
    <div className={styles.container}>
      <Button
        icon={<DimensionPanelIcons.HFlip />}
        id="horizontal_flip"
        onClick={() => flipSelectedElements(-1, 1)}
        title={t.hflip}
        type="text"
      />
      <Button
        icon={<DimensionPanelIcons.VFlip />}
        id="vertical_flip"
        onClick={() => flipSelectedElements(1, -1)}
        title={t.vflip}
        type="text"
      />
    </div>
  );
};

export default memo(FlipButtons);
