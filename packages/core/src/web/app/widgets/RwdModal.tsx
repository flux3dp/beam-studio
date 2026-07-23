import React, { useMemo, useState } from 'react';

import { match } from 'ts-pattern';

import FloatingPopover from '@core/app/components/dialogs/popover/FloatingPopover';
import type { Props as FloatingPopoverProps } from '@core/app/components/dialogs/popover/FloatingPopover';
import Header from '@core/app/components/dialogs/popover/Header';
import { LayoutKey, useLayoutStore } from '@core/app/stores/layoutStore';
import DrawerV from '@core/app/widgets/AutoHeightDrawer';

import styles from './RwdModal.module.scss';

enum DisplayMode {
  Null,
  BottomDrawer,
  FloatingPopover,
}

const defaultDisplayModes = {
  [LayoutKey.Desktop]: DisplayMode.Null,
  [LayoutKey.Mobile]: DisplayMode.BottomDrawer,
  [LayoutKey.Tablet]: DisplayMode.FloatingPopover,
};

type CommonProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  getContainer?: () => HTMLElement;
  onClose?: () => void;
  open?: boolean;
  title?: React.ReactNode;
};

export type Props = CommonProps & {
  floatingPopoverProps: Pick<FloatingPopoverProps, 'placement' | 'reference' | 'zIndex'>;
};

const RwdModal = ({ floatingPopoverProps, onClose: propOnClose, open: propsOpen, ...props }: Props) => {
  const layout = useLayoutStore((state) => state.layout);
  const [_open, _setOpen] = useState(false);

  const open = propsOpen ?? _open;
  const onClose = () => {
    propOnClose?.();
    _setOpen(false);
  };
  const displayMode = useMemo(() => defaultDisplayModes[layout], [layout]);

  return match(displayMode)
    .with(DisplayMode.BottomDrawer, () => {
      const {
        children,
        footer,
        getContainer = () => document.querySelector('#svg_editor') ?? document.body,
        title,
      } = props;

      return (
        <DrawerV
          destroyOnClose={true}
          enableResizable={{ top: true }}
          footer={footer}
          getContainer={getContainer}
          onClose={onClose}
          open={open}
          title={title}
        >
          {children}
        </DrawerV>
      );
    })
    .with(DisplayMode.FloatingPopover, () => {
      const { children, footer, getContainer, title } = props;
      const content = (
        <div className={styles['popover-content']}>
          <Header closable onClose={onClose} title={title} />
          {children}
          {footer}
        </div>
      );

      return (
        <FloatingPopover getContainer={getContainer} open={open} {...floatingPopoverProps}>
          {content}
        </FloatingPopover>
      );
    })
    .otherwise(() => null);
};

export default RwdModal;
