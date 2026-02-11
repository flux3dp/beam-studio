import React, { use } from 'react';

import classNames from 'classnames';

import { FullWindowPanelContext } from '@core/app/widgets/FullWindowPanel/FullWindowPanel';

import styles from './Header.module.scss';

interface Props {
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
}

const Header = ({ children, className = '', icon, title }: Props): React.JSX.Element => {
  // For future need to use context
  use(FullWindowPanelContext);

  return (
    <div className={classNames(styles.header, className)}>
      {icon && <div className={styles.icon}>{icon}</div>}
      {title && <div className={styles.title}>{title}</div>}
      {children}
    </div>
  );
};

export default Header;
