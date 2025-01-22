import React, { memo } from 'react';

import { Button } from 'antd';

import DimensionPanelIcons from '@core/app/icons/dimension-panel/DimensionPanelIcons';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

interface Props {
  isLocked: boolean;
  onClick: () => void;
}

const RatioLock = ({ isLocked, onClick }: Props): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.object_panel;
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <ObjectPanelItem.Item
        content={isLocked ? <DimensionPanelIcons.Locked /> : <DimensionPanelIcons.Unlocked />}
        id="lock"
        onClick={onClick}
      />
    );
  }

  return (
    <Button
      icon={isLocked ? <DimensionPanelIcons.Locked /> : <DimensionPanelIcons.Unlocked />}
      id="lock"
      onClick={onClick}
      title={isLocked ? t.unlock_aspect : t.lock_aspect}
      type="text"
    />
  );
};

export default memo(RatioLock);
