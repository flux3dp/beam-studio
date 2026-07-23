import React, { memo } from 'react';

import IconButton from '@core/app/components/beambox/RightPanel/common/IconButton';
import DimensionPanelIcons from '@core/app/icons/dimension-panel/DimensionPanelIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { templateModes, useWithinInteractionModes } from '@core/app/stores/interactionModeStore';
import { ControlType } from '@core/helpers/element/editable/base';
import useI18n from '@core/helpers/useI18n';

import style from './DimensionPanel.module.scss';

interface Props {
  disabled?: boolean;
  isLocked: boolean;
  onClick: () => void;
}

const RatioLock = ({ disabled, isLocked, onClick }: Props): React.JSX.Element => {
  const t = useI18n().beambox.right_panel.object_panel;
  const isWithinTemplateModes = useWithinInteractionModes(templateModes);
  const editable = useSelectedElementStore((state) => state.editableInfo[ControlType._SIZE]?.value);

  return (
    <IconButton
      className={style['ratio-lock']}
      disabled={disabled || (isWithinTemplateModes && !editable)}
      icon={isLocked ? <DimensionPanelIcons.Locked /> : <DimensionPanelIcons.Unlocked />}
      id="lock"
      onClick={onClick}
      title={isLocked ? t.unlock_aspect : t.lock_aspect}
    />
  );
};

export default memo(RatioLock);
