import { Button } from 'antd';
import type { IDockviewHeaderActionsProps } from 'dockview-react';

import Icons from '@core/app/icons/dockable/DockableIcons';

import styles from './RightComponent.module.scss';
import { addFloatingGroup, setMovedPanel } from './utils';

const RightComponent = ({ api, panels }: IDockviewHeaderActionsProps) => {
  const isFloating = api.location.type === 'floating';

  return (
    <div className={styles.container}>
      <Button
        icon={isFloating ? <Icons.Dock /> : <Icons.Undock />}
        onClick={(e) => {
          if (isFloating) {
            setMovedPanel(panels[0].api);
            api.moveTo({ position: 'right' });
          } else {
            addFloatingGroup(api.id, { width: 300, x: e.clientX - 300, y: e.clientY });
          }
        }}
        size="small"
        type="text"
      />
    </div>
  );
};

export default RightComponent;
