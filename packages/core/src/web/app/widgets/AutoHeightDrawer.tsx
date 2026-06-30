import React, { memo, type ReactNode, useState } from 'react';

import type { DrawerProps } from 'antd';
import { Drawer as AntdDrawer } from 'antd';
import classNames from 'classnames';
import type { Enable } from 're-resizable';
import { Resizable } from 're-resizable';

import styles from './AutoHeightDrawer.module.scss';

export type Props = DrawerProps & {
  children: ReactNode;
  enableResizable?: Enable | false;
  onClose?: () => void;
  open?: boolean;
};

/**
 * Antd Drawer-based + Resizable container + FloatingPanel-like visual styling.
 * - Content-driven height: the panel adapts to its content size
 * - Height is constrained by the available viewport/container bounds
 * - Supports manual user resizing
 *
 * Layout structure:
 * - Header (title): fixed at top
 * - Body (children): scrollable content area
 * - Footer: fixed at bottom
 *
 * Note:
 * This file is modified from ./Drawer.tsx and ./FloatingPanel.tsx.
 * For predefined snap points or fixed-height behavior, use FloatingPanel instead.
 */
const AutoHeightDrawer = memo(
  ({ children, enableResizable, getContainer = false, onClose, open, rootClassName, ...props }: Props) => {
    const [height, setHeight] = useState<number | undefined>(undefined);

    return (
      <AntdDrawer
        {...props}
        afterOpenChange={(is_opened) => {
          if (!is_opened) setHeight(undefined);
        }}
        destroyOnClose
        drawerRender={(node) => {
          return (
            <Resizable
              className={styles['resizable-container']}
              enable={enableResizable}
              handleClasses={{ top: styles['resizable-handle'] }}
              maxHeight="100vh"
              minHeight={0}
              onResize={(_event, _direction, elementRef) => {
                setHeight(elementRef.offsetHeight);
              }}
              onResizeStop={() => {
                if (height !== undefined && height <= 50) {
                  setHeight(0);
                  onClose?.();
                }
              }}
              size={{ height: height ?? 'auto', width: '100%' }}
            >
              {node}
            </Resizable>
          );
        }}
        getContainer={getContainer}
        height="fit-content"
        mask={false}
        onClose={onClose}
        open={open}
        placement="bottom"
        rootClassName={classNames(rootClassName, styles.drawer)}
      >
        {children}
      </AntdDrawer>
    );
  },
);

export default AutoHeightDrawer;
