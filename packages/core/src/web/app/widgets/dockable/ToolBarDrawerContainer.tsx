import { memo } from 'react';

import { drawerContainerId } from './constants';
import styles from './ToolBarDrawerContainer.module.scss';

// Handle tool bar position with Dockable Layout for Desktop
const ToolBarDrawerContainer = memo(() => {
  return <div className={styles['drawer-container']} id={drawerContainerId} />;
});

export default ToolBarDrawerContainer;
