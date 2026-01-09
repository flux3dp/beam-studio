import { memo, type ReactNode, useState } from 'react';

import { LeftOutlined } from '@ant-design/icons';
import type { DrawerProps } from 'antd';
import { Drawer as AntdDrawer, ConfigProvider } from 'antd';
import type { Enable } from 're-resizable';
import { Resizable } from 're-resizable';

import styles from './Drawer.module.scss';

export type Props = Pick<DrawerProps, 'classNames' | 'closeIcon' | 'getContainer' | 'rootClassName' | 'title'> & {
  children: ReactNode;
  enableResizable?: Enable | false;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  showHandle?: boolean;
};

const Drawer = memo(
  ({
    children,
    classNames,
    closeIcon,
    enableResizable,
    getContainer = false,
    isOpen,
    rootClassName,
    setIsOpen,
    showHandle = true,
    title,
  }: Props) => {
    const [width, setWidth] = useState(400);
    // default motion duration for the drawer
    // this is used to disable the animation when resizing the drawer
    const [motionDurationSlow, setMotionDurationSlow] = useState('0.3s');
    const onClose = () => setIsOpen(false);

    return (
      <ConfigProvider theme={{ token: { motionDurationSlow } }}>
        <AntdDrawer
          classNames={classNames}
          closable={false}
          closeIcon={closeIcon}
          getContainer={getContainer}
          mask={false}
          onClose={onClose}
          open={isOpen}
          placement="left"
          rootClassName={rootClassName}
          // use style to override :where
          style={{ boxShadow: 'none' }}
          styles={{
            body: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '0px' },
            content: { backgroundColor: 'transparent' },
            wrapper: { boxShadow: 'none' },
          }}
          title={title}
          width={width}
        >
          {showHandle && (
            <div className={styles.handle} onClick={onClose}>
              <LeftOutlined />
            </div>
          )}
          <Resizable
            enable={enableResizable}
            handleClasses={{ right: styles['resizable-handle'] }}
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
