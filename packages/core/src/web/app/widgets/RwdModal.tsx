import React, { useMemo, useState } from 'react';

import { Button, Modal } from 'antd';
import classNames from 'classnames';
import { match } from 'ts-pattern';

import FloatingPopover from '@core/app/components/dialogs/popover/FloatingPopover';
import type { Props as FloatingPopoverProps } from '@core/app/components/dialogs/popover/FloatingPopover';
import Header from '@core/app/components/dialogs/popover/Header';
import Popover from '@core/app/components/dialogs/popover/Popover';
import type { Props as PopoverProps } from '@core/app/components/dialogs/popover/Popover';
import { RwdKey, useRwdKey } from '@core/app/stores/screenStore';
import DrawerV from '@core/app/widgets/AutoHeightDrawer';
import type { Props as DrawerVProps } from '@core/app/widgets/AutoHeightDrawer';
import DraggableModal from '@core/app/widgets/DraggableModal';
import type { Props as DraggableModalProps } from '@core/app/widgets/DraggableModal';

import styles from './RwdModal.module.scss';

enum DisplayMode {
  Null,
  BottomDrawer,
  Popover,
  FloatingPopover,
  Modal,
  DraggableModal,
}

const TriggerWrapper = ({ children, onClick: wrapperOnClick }) => {
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
      onClick: mergedOnClick,
    });
  });
};

type _Props = DraggableModalProps & DrawerVProps;

const defaultDisplayModes = {
  [RwdKey.Desktop]: DisplayMode.Modal,
  [RwdKey.Mobile]: DisplayMode.BottomDrawer,
  [RwdKey.Tablet]: DisplayMode.FloatingPopover,
};

type CommonProps = {
  children: React.ReactNode;
  displayModes?: { [key in RwdKey]?: DisplayMode };
  getContainer?: () => HTMLElement;
  noContentWrapper?: boolean;
  onClose?: () => void;
  open?: boolean;
  title?: React.ReactNode;
};

export type Props = CommonProps &
  DraggableModalProps &
  Pick<DrawerVProps, 'enableResizable'> &
  Pick<FloatingPopoverProps, 'placement' | 'reference'> &
  Pick<PopoverProps, 'align' | 'onOpenChange' | 'placement' | 'triggerComponent' | 'triggerProps'>;

const RwdModal = ({ displayModes, onClose: propOnClose, open: propsOpen, ...props }: Props) => {
  const rwdKey = useRwdKey();
  const [_open, _setOpen] = useState(false);

  const open = propsOpen ?? _open;
  const onClose = () => {
    props.onOpenChange?.(false);
    propOnClose?.();
    _setOpen(false);
  };
  const displayMode = useMemo(() => ({ ...defaultDisplayModes, ...displayModes })[rwdKey], [displayModes, rwdKey]);

  return match(displayMode)
    .with(DisplayMode.BottomDrawer, () => {
      const {
        destroyOnClose = true,
        enableResizable = { top: true },
        getContainer = () => document.querySelector('#svg_editor') ?? document.body,
        triggerComponent,
        triggerProps,
      } = props;

      return (
        <>
          <TriggerWrapper onClick={() => _setOpen(!_open)}>{triggerComponent}</TriggerWrapper>
          {triggerProps && (
            <Button
              {...triggerProps}
              color={_open ? 'primary' : 'default'}
              onClick={(e) => {
                triggerProps?.onClick?.(e);
                _setOpen(!_open);
              }}
              variant={_open ? 'filled' : 'outlined'}
            />
          )}

          <DrawerV
            {...props}
            destroyOnClose={destroyOnClose}
            enableResizable={enableResizable}
            getContainer={getContainer}
            onClose={onClose}
            open={open ?? _open}
          />
        </>
      );
    })
    .with(DisplayMode.Popover, () => <Popover open={open} {...props} />)
    .with(DisplayMode.FloatingPopover, () => {
      const { children, getContainer, noContentWrapper, placement, reference, title } = props;
      const content = (
        <div style={{ maxHeight: '80vh', minWidth: 300, overflow: 'auto', padding: 16 }}>
          <Header closable onClose={onClose} title={title} />
          {children}
        </div>
      );

      return (
        <FloatingPopover getContainer={getContainer} open={open} placement={placement} reference={reference}>
          {content}
        </FloatingPopover>
      );
    })
    .with(DisplayMode.Modal, () => <Modal {...props} />)
    .with(DisplayMode.DraggableModal, () => {
      const { className, footer = null, mask = false, onClose } = props;

      return (
        <DraggableModal
          {...props}
          className={classNames(className, styles.modal)}
          footer={footer}
          mask={mask}
          onCancel={onClose}
        />
      );
    })
    .otherwise(() => null);
};

export default RwdModal;
