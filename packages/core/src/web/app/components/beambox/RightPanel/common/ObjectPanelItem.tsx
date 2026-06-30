import type { RefObject } from 'react';
import React, { use, useRef } from 'react';

import type { ButtonProps } from 'antd';
import { Button } from 'antd';

import RwdModal from '@core/app/widgets/RwdModal';

import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

import styles from './ObjectPanelItem.module.scss';

type TriggerProps = ButtonProps & {
  active?: boolean;
  objectPanelKey?: string;
  ref?: RefObject<Element | null>;
};

export const ButtonItem = ({ active, objectPanelKey, onClick, ref, ...props }: TriggerProps) => {
  const context = use(ObjectPanelContext);
  const { activeKey, updateActiveKey } = context;

  const isActive = active ?? objectPanelKey === activeKey;

  return (
    <Button
      className={styles.button}
      color={isActive ? 'primary' : 'default'}
      onClick={(e) => {
        updateActiveKey(isActive ? null : (objectPanelKey ?? null));
        onClick?.(e);
      }}
      ref={(node) => {
        if (ref) {
          ref.current = node;
        }
      }}
      size="large"
      styles={{ icon: { fontSize: 20 } }}
      variant={isActive ? 'filled' : 'outlined'}
      {...props}
    />
  );
};

interface Props {
  disabled?: boolean;
  icon: React.ReactNode;
  id: string;
  isActive?: boolean;
  itemChildren?: React.ReactNode;
  /** @deprecated use title instead */
  label?: React.ReactNode;
  noContentWrapper?: boolean;
  onOpenChange?: (open: boolean) => void;
  renderContent: () => React.ReactNode;
  title?: React.ReactNode;
}

export const ObjectPanelItem = ({
  disabled,
  icon,
  id,
  isActive: propsIsActive,
  itemChildren,
  label,
  noContentWrapper = false,
  onOpenChange,
  renderContent,
  title,
}: Props): React.ReactNode => {
  const context = use(ObjectPanelContext);
  const { activeKey, updateActiveKey } = context;
  const ref = useRef<Element | null>(null);
  const isActive = propsIsActive ?? id === activeKey;

  if (disabled) return null;

  return (
    <>
      <ButtonItem active={isActive} icon={icon} objectPanelKey={id} ref={ref}>
        {itemChildren}
      </ButtonItem>
      <RwdModal
        noContentWrapper={noContentWrapper}
        onOpenChange={(open) => {
          onOpenChange?.(open);
          updateActiveKey(open ? id : null);
        }}
        open={isActive}
        placement="top-start"
        reference={ref.current}
        title={title ?? label}
        triggerComponent={''}
      >
        {renderContent()}
      </RwdModal>
    </>
  );
};
