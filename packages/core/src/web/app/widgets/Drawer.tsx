import { memo, type ReactNode, useState } from 'react';

import { LeftOutlined } from '@ant-design/icons';
import { Drawer as AntdDrawer, ConfigProvider } from 'antd';
import { Resizable } from 're-resizable';

import styles from './Drawer.module.scss';

interface Props {
  children: ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Drawer = memo(({ children, isOpen, setIsOpen }: Props) => {
  const [width, setWidth] = useState(400);
  // default motion duration for the drawer
  // this is used to disable the animation when resizing the drawer
  const [motionDurationSlow, setMotionDurationSlow] = useState('0.3s');
  const onClose = () => setIsOpen(false);

  return (
    <ConfigProvider theme={{ token: { motionDurationSlow } }}>
      <AntdDrawer
        closable={false}
        getContainer={false}
        mask={false}
        onClose={onClose}
        open={isOpen}
        placement="left"
        // use style to override :where
        style={{
          boxShadow: 'none',
        }}
        styles={{
          body: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            padding: '0px',
          },
          content: {
            backgroundColor: 'transparent',
          },
          wrapper: { boxShadow: 'none' },
        }}
        width={width}
      >
        <div className={styles.handle} onClick={onClose}>
          <LeftOutlined />
        </div>
        <Resizable
          enable={{ right: true }}
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
});

export default Drawer;
