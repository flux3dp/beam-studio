import React, { memo, type ReactNode, useState } from 'react';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { DrawerProps } from 'antd';
import { Drawer as AntdDrawer, ConfigProvider } from 'antd';
import classNames from 'classnames';
import type { Enable } from 're-resizable';
import { Resizable } from 're-resizable';

import styles from './Drawer.module.scss';

export type Props = DrawerProps & {
  children: ReactNode;
  enableResizable?: Enable | false;
  isOpen: boolean;
  onClose: () => void;
  showHandle?: boolean;
};

const Drawer = memo(
  ({
    children,
    classNames: propClassNames,
    closeIcon,
    destroyOnClose,
    enableResizable,
    getContainer = false,
    isOpen,
    onClose,
    placement = 'left',
    rootClassName,
    showHandle = true,
    title,
  }: Props) => {
    const [width, setWidth] = useState(400);
    // default motion duration for the drawer
    // this is used to disable the animation when resizing the drawer
    const [motionDurationSlow, setMotionDurationSlow] = useState('0.3s');

    return (
      <ConfigProvider theme={{ token: { motionDurationSlow } }}>
        <AntdDrawer
          classNames={propClassNames}
          closable={false}
          closeIcon={closeIcon}
          destroyOnClose={destroyOnClose}
          getContainer={getContainer}
          mask={false}
          onClose={onClose}
          open={isOpen}
          placement={placement}
          rootClassName={rootClassName}
          // use style to override :where
          styles={{
            body: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '0px' },
            content: { backgroundColor: 'transparent' },
          }}
          title={title}
          width={width}
        >
          {showHandle && (
            <div className={classNames(styles.handle, styles[placement])} onClick={onClose}>
              {placement === 'left' ? <LeftOutlined /> : <RightOutlined />}
            </div>
          )}
          <Resizable
            enable={enableResizable}
            handleClasses={{ [placement === 'left' ? 'right' : 'left']: styles['resizable-handle'] }}
            maxWidth={638}
            minWidth={360}
            onResize={(_event, _direction, elementRef) => {
              setWidth(elementRef.offsetWidth);
            }}
            onResizeStart={() => setMotionDurationSlow('0s')}
            onResizeStop={() => setMotionDurationSlow('0.3s')}
            size={{ height: '100%', width }}
          >
            <div className={styles['resizable-drawer-content']}>{children}</div>
          </Resizable>
        </AntdDrawer>
      </ConfigProvider>
    );
  },
);

export default Drawer;
