import { memo, useMemo } from 'react';

import classNames from 'classnames';

import { getOS } from '@core/helpers/getOS';

import { drawerContainerId } from './constants';
import styles from './ToolBarDrawerContainer.module.scss';

// Handle tool bar position with Dockable Layout for Desktop
const ToolBarDrawerContainer = memo(() => {
  const isWindows = useMemo(() => getOS() === 'Windows', []);

  return <div className={classNames(styles['drawer-container'], { [styles.win]: isWindows })} id={drawerContainerId} />;
});

export default ToolBarDrawerContainer;
