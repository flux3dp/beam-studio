import classNames from 'classnames';
import React, { useContext } from 'react';

import { FullWindowPanelContext } from 'app/widgets/FullWindowPanel/FullWindowPanel';

import styles from './Header.module.scss';

interface Props {
  icon?: React.ReactNode;
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

const Header = ({ icon, title, className = '', children }: Props): JSX.Element => {
  // For future need to use context
  useContext(FullWindowPanelContext);
  return (
    <div className={classNames(styles.header, className)}>
      {icon && <div className={styles.icon}>{icon}</div>}
      {title && <div className={styles.title}>{title}</div>}
      {children}
    </div>
  );
};

export default Header;
