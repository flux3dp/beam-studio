import React, { useState } from 'react';

import type { PopoverProps } from 'antd';
import { Popover as AntdPopover, Button } from 'antd';
import { type ButtonProps } from 'antd';

import Header from '@core/app/components/dialogs/popover/Header';
import { fixme } from '@core/helpers/is-dev';

import styles from './Popover.module.scss';

fixme('Update type, better use another method to handle trigger props');

const TriggerWrapper = ({
  children,
  onClick: wrapperOnClick,
  open,
}: {
  children: React.JSX.Element;
  onClick?: () => void;
  open: boolean;
}) => {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    const originalOnClick = child.props.onClick;

    const mergedOnClick = (e) => {
      // 先執行 Wrapper 的邏輯
      wrapperOnClick?.(e);

      // 再執行原本的 onClick（確保不被覆蓋）
      originalOnClick?.(e);
    };

    return React.cloneElement(child, {
      active: open,
      onClick: mergedOnClick,
    });
  });
};

export type Props = Omit<PopoverProps, 'content' | 'trigger'> & {
  children: React.ReactNode;
  closable?: boolean;
  showHeader?: boolean;
  title?: React.ReactNode;
  triggerComponent?: React.ReactNode;
  triggerProps?: Omit<ButtonProps, 'color' | 'variant'>;
};

const Popover = ({
  align,
  arrow = false,
  children,
  closable,
  onOpenChange: propsOnOpenChange,
  open: propsOpen,
  placement = 'top',
  showHeader = true,
  title,
  triggerComponent,
  triggerProps,
  ...props
}: Props): React.JSX.Element => {
  const [_open, _setOpen] = useState(false);
  const open = propsOpen ?? _open;
  const setOpen = propsOnOpenChange ?? _setOpen;

  return (
    <AntdPopover
      align={align}
      arrow={arrow}
      content={
        <>
          {showHeader && <Header closable={closable} onClose={() => setOpen(false)} title={title} />}
          {children}
        </>
      }
      open={open}
      placement={placement}
      trigger={[]}
      zIndex={5}
      {...props}
    >
      <TriggerWrapper onClick={() => setOpen(!open)} open={open}>
        {triggerComponent}
      </TriggerWrapper>
      {triggerProps && (
        <Button
          className={styles.button}
          {...triggerProps}
          color={open ? 'primary' : 'default'}
          onClick={(e) => {
            triggerProps?.onClick?.(e);
            setOpen(!open);
          }}
          variant={open ? 'filled' : 'outlined'}
        />
      )}
    </AntdPopover>
  );
};

export default Popover;
