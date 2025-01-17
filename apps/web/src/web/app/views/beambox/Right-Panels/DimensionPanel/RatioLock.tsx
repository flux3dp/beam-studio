import React, { memo } from 'react';
import { Button } from 'antd';

import DimensionPanelIcons from 'app/icons/dimension-panel/DimensionPanelIcons';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import useI18n from 'helpers/useI18n';
import { useIsMobile } from 'helpers/system-helper';

interface Props {
  isLocked: boolean;
  onClick: () => void;
}

const RatioLock = ({ isLocked, onClick }: Props): JSX.Element => {
  const t = useI18n().beambox.right_panel.object_panel;
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <ObjectPanelItem.Item
        id="lock"
        content={
          isLocked ? <DimensionPanelIcons.Locked /> : <DimensionPanelIcons.Unlocked />
        }
        onClick={onClick}
      />
    );
  }

  return (
    <Button
      id="lock"
      type="text"
      title={isLocked ? t.unlock_aspect : t.lock_aspect}
      icon={isLocked ? <DimensionPanelIcons.Locked /> : <DimensionPanelIcons.Unlocked />}
      onClick={onClick}
    />
  );
};

export default memo(RatioLock);
