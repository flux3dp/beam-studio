import React, { useMemo, useState } from 'react';

import { Button } from 'antd';
import classNames from 'classnames';

import Label from '@core/app/components/beambox/RightPanel/common/Label';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import { templateModes, useIsInteractionMode, useWithinInteractionModes } from '@core/app/stores/interactionModeStore';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { type ControlType } from '@core/helpers/element/editable/base';
import { toggleEditableInfo } from '@core/helpers/element/editable/setter';

import styles from './ControlBlock.module.scss';

export const EditableButton = ({
  children,
  editable,
  onClick,
  position = 'default',
  setHighlight,
}: {
  children?: React.ReactNode;
  editable?: boolean;
  onClick: () => void;
  position?: 'default' | 'top-right';
  setHighlight?: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <Button
    className={position === 'default' ? styles.button : styles[`button-${position}`]}
    color={editable ? 'primary' : 'default'}
    icon={<ObjectPanelIcons.Editable />}
    iconPosition="end"
    onClick={onClick}
    onMouseEnter={() => setHighlight?.(true)}
    onMouseLeave={() => setHighlight?.(false)}
    size="small"
    variant="text"
  >
    {children}
  </Button>
);

interface Props {
  children?: React.ReactNode;
  className?: string;
  extra?: React.ReactNode;
  forceVisible?: boolean;
  label?: React.ReactNode;
  position?: 'default' | 'top-right';
  type: ControlType;
}

const ControlBlock = ({ children, className, extra, forceVisible, label, position, type }: Props) => {
  const isTablet = useIsTabletOrMobile();
  const isMultiSelect = useSelectedElementStore((state) => state.elementCount > 1);
  const editable = useSelectedElementStore((state) => state.editableInfo[type]?.value);
  const showButton = useIsInteractionMode('project') && !isMultiSelect;
  const isWithinTemplateModes = useWithinInteractionModes(templateModes);
  const [highlight, setHighlight] = useState(false);
  const withLabel = useMemo(() => isTablet && label, [isTablet, label]);
  const button = useMemo(
    () =>
      showButton && (
        <EditableButton
          editable={editable}
          onClick={() => toggleEditableInfo(type)}
          position={position}
          setHighlight={setHighlight}
        />
      ),
    [showButton, editable, position, type],
  );

  if (!forceVisible && isWithinTemplateModes && !editable) return null;

  return (
    <div
      className={classNames(className, styles.block, {
        [styles.editable]: showButton && editable,
        [styles.highlight]: highlight,
      })}
    >
      {withLabel && (
        <Label>
          {label}
          {extra}
          {button}
        </Label>
      )}
      {children}
      {!withLabel && extra}
      {!withLabel && button}
    </div>
  );
};

export default ControlBlock;
