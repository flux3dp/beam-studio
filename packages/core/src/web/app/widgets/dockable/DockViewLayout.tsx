import { useEffect } from 'react';

import { DockviewReact, themeLight } from 'dockview-react';

import { components } from '@core/app/widgets/dockable/constants';
import RightComponent from '@core/app/widgets/dockable/RightComponent';
import Tab from '@core/app/widgets/dockable/Tab';
import { onReady, setIsMobile } from '@core/app/widgets/dockable/utils';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './DockViewLayout.module.scss';
import 'dockview-react/dist/styles/dockview.css';

const DockViewLayout = () => {
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsMobile(isMobile);
  }, [isMobile]);

  return (
    <DockviewReact
      className={styles.dockview}
      components={components}
      defaultTabComponent={Tab}
      disableAutoResizing={false}
      floatingGroupBounds="boundedWithinViewport"
      onReady={(e) => {
        onReady(e);
        setIsMobile(isMobile);
      }}
      rightHeaderActionsComponent={RightComponent}
      theme={themeLight}
    />
  );
};

export default DockViewLayout;
