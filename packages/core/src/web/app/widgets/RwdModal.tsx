import React, { useMemo } from 'react';

import { match } from 'ts-pattern';

import FloatingPopover from '@core/app/components/dialogs/popover/FloatingPopover';
import type { Props as FloatingPopoverProps } from '@core/app/components/dialogs/popover/FloatingPopover';
import Header from '@core/app/components/dialogs/popover/Header';
import { Layout, useLayoutStore } from '@core/app/stores/layoutStore';
import DrawerV from '@core/app/widgets/AutoHeightDrawer';

import styles from './RwdModal.module.scss';

const DisplayMode = {
  BottomDrawer: 1,
  FloatingPopover: 2,
  Null: -1,
} as const;

const defaultDisplayModes = {
  [Layout.Desktop]: DisplayMode.Null,
  [Layout.Mobile]: DisplayMode.BottomDrawer,
  [Layout.Tablet]: DisplayMode.FloatingPopover,
};

type CommonProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  getContainer?: () => HTMLElement;
  onClose: () => void;
  open: boolean;
  title?: React.ReactNode;
};

export type Props = CommonProps & {
  floatingPopoverProps: Pick<FloatingPopoverProps, 'placement' | 'reference' | 'zIndex'>;
};

const RwdModal = ({ floatingPopoverProps, onClose, open, ...props }: Props) => {
  const layout = useLayoutStore((state) => state.layout);

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
