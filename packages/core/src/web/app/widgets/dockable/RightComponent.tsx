import { ExportOutlined, ImportOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { IDockviewHeaderActionsProps } from 'dockview-react';

import { addFloatingGroup } from '@core/app/widgets/dockable/utils';

import styles from './RightComponent.module.scss';

const RightComponent = ({ api, ...props }: IDockviewHeaderActionsProps) => {
  return (
    <div className={styles.container}>
      {api.location.type === 'floating' ? (
        <Button
          className={styles.action}
          // draggable
          icon={<ImportOutlined />}
          onClick={() => {
            api.moveTo({ position: 'right' });
          }}
          // onDragEndCapture={(e) => {
          //   console.log('Drag end captured', e);
          //   addFloatingGroup(api.id, { width: 300, x: e.clientX - 300, y: e.clientY });
          // }}
          // onPointerDown={() => setVirtualShift(true)}
          // onPointerLeave={() => setVirtualShift(false)}
          // onPointerUp={() => setVirtualShift(false)}
          size="small"
          type="text"
        />
      ) : (
        <Button
          className={styles.action}
          // draggable
          icon={<ExportOutlined />}
          onClick={(e) => {
            console.log('Drag end captured', e);
            addFloatingGroup(api.id, { width: 300, x: e.clientX - 300, y: e.clientY });
          }}
          // onDragEndCapture={(e) => {
          //   console.log('Drag end captured', e);
          //   addFloatingGroup(api.id, { width: 300, x: e.clientX - 300, y: e.clientY });
          // }}
          // onPointerDown={() => setVirtualShift(true)}
          // onPointerLeave={() => setVirtualShift(false)}
          // onPointerUp={() => setVirtualShift(false)}
          size="small"
          type="text"
        />
      )}
    </div>
  );
};

export default RightComponent;
