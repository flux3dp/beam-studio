import type { Ref, RefObject } from 'react';
import React, { useState } from 'react';

import type { ButtonProps } from 'antd';
import { Button } from 'antd';

import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import RwdModal from '@core/app/widgets/RwdModal';

import styles from './ObjectPanelItem.module.scss';

type TriggerProps = ButtonProps & {
  active?: boolean;
  objectPanelKey?: string;
  ref?: Ref<Element | null>;
};

export const ButtonItem = ({ active, id, objectPanelKey, onClick, ref, ...props }: TriggerProps) => {
  const activeKey = useSelectedElementStore((state) => state.activeKey);
  const isActive = active ?? objectPanelKey === activeKey;

  return (
    <Button
      className={styles.button}
      color={isActive ? 'primary' : 'default'}
      id={`object-panel-item-${id}`}
      onClick={(e) => {
        useSelectedElementStore.setState({ activeKey: isActive ? null : (objectPanelKey ?? null) });
        onClick?.(e);
      }}
      ref={(node) => {
        if (ref) {
          if (typeof ref === 'function') ref(node);
          else ref.current = node;
        }
      }}
      size="large"
      variant={isActive ? 'filled' : 'outlined'}
      {...props}
    />
  );
};

interface PopupProps {
  footer?: React.ReactNode;
  id: string;
  isActive?: boolean;
  reference?: Element | null;
  renderContent: () => React.ReactNode;
  title?: React.ReactNode;
}

export const PopupItem = ({
  footer,
  id,
  isActive: propsIsActive,
  reference: propsReference,
  renderContent,
  title,
}: PopupProps): React.ReactNode => {
  const activeKey = useSelectedElementStore((state) => state.activeKey);
  const isActive = propsIsActive ?? id === activeKey;
  const reference = propsReference ?? document.querySelector(`#object-panel-item-${id}`);

  return (
    <RwdModal
      floatingPopoverProps={{ placement: 'top-start', reference, zIndex: 5 }}
      footer={footer}
      onClose={() => useSelectedElementStore.setState({ activeKey: null })}
      open={isActive}
      title={title}
    >
      {renderContent()}
    </RwdModal>
  );
};

interface Props {
  disabled?: boolean;
  footer?: React.ReactNode;
  icon: React.ReactNode;
  id: string;
  isActive?: boolean;
  itemChildren?: React.ReactNode;
  ref?: RefObject<Element | null>;
  renderContent: () => React.ReactNode;
  title?: React.ReactNode;
}

export const ObjectPanelItem = ({
  disabled,
  footer,
  icon,
  id,
  isActive: propsIsActive,
  itemChildren,
  ref: propsRef,
  renderContent,
  title,
}: Props): React.ReactNode => {
  const activeKey = useSelectedElementStore((state) => state.activeKey);
  const [ref, setRef] = useState<Element | null>(null);
  const isActive = propsIsActive ?? id === activeKey;

  if (disabled) return null;

  return (
    <>
      <ButtonItem
        active={isActive}
        icon={icon}
        id={id}
        objectPanelKey={id}
        ref={(node) => {
          setRef(node);

          if (propsRef) propsRef.current = node;
        }}
      >
        {itemChildren}
      </ButtonItem>
      <PopupItem
        footer={footer}
        id={id}
        isActive={isActive}
        reference={ref}
        renderContent={renderContent}
        title={title}
      />
    </>
  );
};
