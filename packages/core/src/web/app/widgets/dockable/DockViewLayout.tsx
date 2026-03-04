import { useEffect } from 'react';

import { DockviewReact, themeLight } from 'dockview-react';
import 'dockview-react/dist/styles/dockview.css';

import { components } from './constants';
import styles from './DockViewLayout.module.scss';
import RightComponent from './RightComponent';
import Tab from './Tab';
import { disableDockview, onReady } from './utils';

const DockViewLayout = () => {
  useEffect(() => disableDockview, []);

  return (
    <DockviewReact
      className={styles.dockview}
      components={components}
      defaultTabComponent={Tab}
      disableAutoResizing={false}
      floatingGroupBounds="boundedWithinViewport"
      onReady={onReady}
      rightHeaderActionsComponent={RightComponent}
      scrollbars="native"
      theme={themeLight}
    />
  );
};

export default DockViewLayout;
