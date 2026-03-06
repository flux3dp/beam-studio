import React, { useEffect, useState } from 'react';

import { Button } from 'antd';
import type { IDockviewHeaderActionsProps } from 'dockview-react';

import Icons from '@core/app/icons/dockable/DockableIcons';

import styles from './RightComponent.module.scss';
import { addFloatingGroup, setMovedPanel } from './utils';

const RightComponent = ({ api, panels }: IDockviewHeaderActionsProps) => {
  const [isFloating, setIsFloating] = useState(api.location.type === 'floating');

  useEffect(() => {
    // Note: this component may not re-render when location change, need to listen to the event
    const dispose = api.onDidLocationChange((e) => {
      setIsFloating(e.location.type === 'floating');
    });

    return dispose.dispose;
  }, [api]);

  return (
    <div className={styles.container}>
      <Button
        icon={isFloating ? <Icons.Dock /> : <Icons.Undock />}
        onClick={(e) => {
          setMovedPanel(panels[0].api);

          if (isFloating) {
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
