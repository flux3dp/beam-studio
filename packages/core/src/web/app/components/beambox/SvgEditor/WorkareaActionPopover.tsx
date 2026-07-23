import React, { useEffect, useMemo, useState } from 'react';

import type { MenuProps } from 'antd';
import { Button, Dropdown } from 'antd';

import FloatingPopover from '@core/app/components/dialogs/popover/FloatingPopover';
import WorkareaIcons from '@core/app/icons/workarea/WorkareaIcons';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import styles from './WorkareaActionPopover.module.scss';

const eventEmitter = eventEmitterFactory.createEventEmitter('workarea');

type MenuItem = {
  disabled: boolean;
  label: string;
  onClick: () => void;
};

const PrimaryActions = ['delete', 'duplicate', 'group', 'ungroup'] as const;

type PrimaryKey = (typeof PrimaryActions)[number];

const ActionIcons: { [key in PrimaryKey]: React.ReactNode } = {
  delete: <WorkareaIcons.Delete />,
  duplicate: <WorkareaIcons.Duplicate />,
  group: <WorkareaIcons.Group />,
  ungroup: <WorkareaIcons.Ungroup />,
};

interface Props {
  items: MenuProps['items'];
}

const WorkareaActionPopover = ({ items }: Props): React.ReactNode => {
  const selectedElement = useSelectedElementStore((state) => state.selectedElement);
  const [reference, setReference] = useState<Element | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const visible = useMemo(() => selectedElement && !isDragging && reference, [isDragging, reference, selectedElement]);

  const buttons: React.ReactNode[] = [];

  if (visible) {
    PrimaryActions.forEach((key) => {
      const item = items?.find((item) => item?.key === key) as MenuItem | undefined;

      if (item && !item.disabled) {
        buttons.push(
          <Button
            className={styles.button}
            danger={key === 'delete'}
            icon={ActionIcons[key]}
            key={key}
            onClick={item.onClick}
            title={item.label}
            type="text"
          />,
        );
      }
    });
  }

  useEffect(() => {
    if (!reference && selectedElement) setReference(document.querySelector('#selectorParentGroup'));
  }, [reference, selectedElement]);

  useEffect(() => {
    setIsDragging(false);

    const handleDragStart = () => setIsDragging(true);
    const handleDragEnd = () => setIsDragging(false);

    eventEmitter.on('objectDragStart', handleDragStart);
    eventEmitter.on('objectDragEnd', handleDragEnd);

    return () => {
      eventEmitter.off('objectDragStart', handleDragStart);
      eventEmitter.off('objectDragEnd', handleDragEnd);
    };
  }, [selectedElement]);

  if (!visible) return null;

  return (
    <FloatingPopover noAnimation open reference={reference}>
      <div className={styles.container}>
        {buttons}
        <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
          <Button className={styles.button} icon={<WorkareaIcons.More />} type="text" />
        </Dropdown>
      </div>
    </FloatingPopover>
  );
};

export default WorkareaActionPopover;
